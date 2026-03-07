import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN!;
const squareLocationId = process.env.SQUARE_LOCATION_ID!;
const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

const SQUARE_API_URL = squareEnvironment === 'production'
  ? 'https://connect.squareup.com/v2'
  : 'https://connect.squareupsandbox.com/v2';

interface CheckoutRequest {
  classId: string;
  studentId: string;
  payerId: string;
  amount: number;
  redirectUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { classId, studentId, payerId, amount, redirectUrl } = body;

    // Validate required fields
    if (!classId || !studentId || !payerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Verify the amount matches the class price
    if (Math.abs(amount - parseFloat(classData.price)) > 0.01) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Create idempotency key for Square
    const idempotencyKey = uuidv4();

    // Create Square checkout
    const checkoutData = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: squareLocationId,
        line_items: [
          {
            name: classData.title,
            quantity: '1',
            base_price_money: {
              amount: Math.round(amount * 100), // Convert to cents
              currency: 'USD',
            },
          },
        ],
        metadata: {
          classId,
          studentId,
          payerId,
        },
      },
      checkout_options: {
        redirect_url: redirectUrl || `${request.headers.get('origin')}/enrollment/success`,
        allow_tipping: false,
        accepted_payment_methods: {
          apple_pay: true,
          google_pay: true,
        },
      },
    };

    // Call Square API to create checkout
    const squareResponse = await fetch(`${SQUARE_API_URL}/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${squareAccessToken}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!squareResponse.ok) {
      const errorData = await squareResponse.json();
      console.error('Square API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: errorData },
        { status: 500 }
      );
    }

    const squareData = await squareResponse.json();
    const paymentLink = squareData.payment_link;

    // Create pending payment record in database
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        square_payment_id: paymentLink.id,
        square_order_id: paymentLink.order_id,
        payer_id: payerId,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        description: `Enrollment for ${classData.title}`,
        metadata: {
          classId,
          studentId,
          idempotencyKey,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database error creating payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Create pending enrollment record
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        class_id: classId,
        student_id: studentId,
        payment_id: paymentData.id,
        enrolled_by: payerId,
        status: 'pending',
      });

    if (enrollmentError) {
      console.error('Database error creating enrollment:', enrollmentError);
      // Note: payment record still exists, webhook will handle cleanup if needed
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: paymentLink.url,
      paymentId: paymentData.id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
