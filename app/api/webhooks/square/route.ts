import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const squareWebhookSecret = process.env.SQUARE_WEBHOOK_SECRET!;

function verifySquareSignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', squareWebhookSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      console.error('Missing Square signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifySquareSignature(body, signature)) {
      console.error('Invalid Square webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log('Square webhook event received:', event.type);

    // Initialize Supabase with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated': {
        const payment = event.data.object.payment;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const status = payment.status;

        // Find our payment record by Square payment ID
        const { data: paymentRecord, error: findError } = await supabase
          .from('payments')
          .select('*, enrollments(*)')
          .eq('square_payment_id', paymentId)
          .or(`square_order_id.eq.${orderId}`)
          .single();

        if (findError || !paymentRecord) {
          console.warn('Payment record not found for Square payment:', paymentId);
          return NextResponse.json({ received: true });
        }

        // Update payment status
        let newPaymentStatus = 'pending';
        if (status === 'COMPLETED') {
          newPaymentStatus = 'completed';
        } else if (status === 'FAILED' || status === 'CANCELED') {
          newPaymentStatus = 'failed';
        }

        await supabase
          .from('payments')
          .update({ status: newPaymentStatus })
          .eq('id', paymentRecord.id);

        // If payment completed, activate enrollment
        if (newPaymentStatus === 'completed') {
          const { error: enrollmentError } = await supabase
            .from('enrollments')
            .update({ status: 'active' })
            .eq('payment_id', paymentRecord.id);

          if (enrollmentError) {
            console.error('Failed to activate enrollment:', enrollmentError);
          } else {
            console.log('Enrollment activated for payment:', paymentRecord.id);
          }
        } else if (newPaymentStatus === 'failed') {
          // Mark enrollment as cancelled if payment failed
          await supabase
            .from('enrollments')
            .update({ status: 'cancelled' })
            .eq('payment_id', paymentRecord.id);
        }

        break;
      }

      case 'order.updated': {
        const order = event.data.object.order;
        const orderId = order.id;
        const orderStatus = order.state;

        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('*')
          .eq('square_order_id', orderId)
          .single();

        if (paymentRecord) {
          // Update payment metadata with order status
          await supabase
            .from('payments')
            .update({
              metadata: {
                ...paymentRecord.metadata,
                orderStatus,
                orderUpdatedAt: new Date().toISOString(),
              },
            })
            .eq('id', paymentRecord.id);
        }

        break;
      }

      case 'refund.created':
      case 'refund.updated': {
        const refund = event.data.object.refund;
        const paymentId = refund.payment_id;

        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('*')
          .eq('square_payment_id', paymentId)
          .single();

        if (paymentRecord) {
          // Update payment status to refunded
          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('id', paymentRecord.id);

          // Update enrollment status to cancelled
          await supabase
            .from('enrollments')
            .update({ status: 'cancelled' })
            .eq('payment_id', paymentRecord.id);
        }

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
