import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { supabaseAdmin, verifyUser } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyUser(authHeader);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { classId, studentId } = body;

    if (!classId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields: classId and studentId' },
        { status: 400 }
      );
    }

    // Verify student belongs to authenticated user
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('parent_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify class exists and is available
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        instructor_profiles!inner(approved)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class is available
    if (classData.status !== 'active') {
      return NextResponse.json(
        { error: 'Class not available' },
        { status: 400 }
      );
    }

    // Check if class is full
    if (classData.max_students && classData.current_enrollment >= classData.max_students) {
      return NextResponse.json(
        { error: 'Class is full' },
        { status: 400 }
      );
    }

    // Check if instructor is approved
    if (!classData.instructor_profiles?.approved) {
      return NextResponse.json(
        { error: 'Class not available' },
        { status: 400 }
      );
    }

    // Create payment intent record
    const { data: paymentIntent, error: paymentError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        student_id: studentId,
        class_id: classId,
        amount_cents: classData.price_cents,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError || !paymentIntent) {
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: classData.title,
              description: classData.description || undefined,
            },
            unit_amount: classData.price_cents,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        payment_intent_id: paymentIntent.id,
        student_id: studentId,
        class_id: classId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/enrollment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/classes/${classId}`,
    });

    // Update payment intent with Stripe session ID
    await supabaseAdmin
      .from('payment_intents')
      .update({ stripe_session_id: session.id })
      .eq('id', paymentIntent.id);

    // Log audit trail
    await supabaseAdmin
      .from('audit_trail')
      .insert({
        event_type: 'checkout_session_created',
        entity_type: 'payment_intent',
        entity_id: paymentIntent.id,
        user_id: user.id,
        metadata: {
          stripe_session_id: session.id,
          class_id: classId,
          student_id: studentId,
          amount_cents: classData.price_cents
        }
      });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
