import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/app/lib/stripe';
import { supabaseAdmin } from '@/app/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentIntentId = session.metadata?.payment_intent_id;
      const studentId = session.metadata?.student_id;
      const classId = session.metadata?.class_id;

      if (!paymentIntentId || !studentId || !classId) {
        console.error('Missing metadata in checkout session:', session.id);
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        );
      }

      // Find payment intent by stripe session ID
      const { data: paymentIntent, error: findError } = await supabaseAdmin
        .from('payment_intents')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (findError || !paymentIntent) {
        console.error('Payment intent not found:', session.id);
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }

      // Update payment intent status
      const { error: updateError } = await supabaseAdmin
        .from('payment_intents')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id: session.payment_intent as string
        })
        .eq('id', paymentIntent.id);

      if (updateError) {
        console.error('Failed to update payment intent:', updateError);
        return NextResponse.json(
          { error: 'Failed to update payment intent' },
          { status: 500 }
        );
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single();

      if (!existingEnrollment) {
        // Create enrollment
        const { error: enrollmentError } = await supabaseAdmin
          .from('enrollments')
          .insert({
            student_id: studentId,
            class_id: classId,
            payment_intent_id: paymentIntent.id,
            status: 'active'
          });

        if (enrollmentError) {
          console.error('Failed to create enrollment:', enrollmentError);
          return NextResponse.json(
            { error: 'Failed to create enrollment' },
            { status: 500 }
          );
        }

        // Increment class enrollment count
        await supabaseAdmin.rpc('increment_class_enrollment', {
          class_id: classId
        });
      }

      // Log audit trail
      await supabaseAdmin
        .from('audit_trail')
        .insert({
          event_type: 'checkout_completed',
          entity_type: 'enrollment',
          entity_id: paymentIntent.id,
          metadata: {
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            class_id: classId,
            student_id: studentId,
            amount_total: session.amount_total
          }
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
