import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { sendMessageSchema } from '@/lib/validations/schemas';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { sender_id, recipient_id, subject, body: messageBody } = parsed.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id,
        recipient_id,
        subject: subject ?? null,
        body: messageBody,
        sent_at: new Date().toISOString(),
        read: false,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') ?? user.id;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('sent_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data }, { status: 200 });
}
