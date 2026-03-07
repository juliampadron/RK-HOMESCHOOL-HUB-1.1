import { NextRequest, NextResponse } from 'next/server';
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
    const {
      classId,
      title,
      description,
      html_content,
      difficulty,
      is_public
    } = body;

    // Validate required fields
    if (!classId || !title || !html_content) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, title, html_content' },
        { status: 400 }
      );
    }

    // Validate difficulty if provided
    if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be: beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    // Verify class exists and belongs to authenticated user
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, instructor_id, title')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor who owns the class
    if (classData.instructor_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be the instructor who owns this class.' },
        { status: 401 }
      );
    }

    // Create game
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .insert({
        class_id: classId,
        instructor_id: user.id,
        title,
        description: description || null,
        html_content,
        difficulty: difficulty || null,
        is_public: is_public || false,
      })
      .select('id, created_at')
      .single();

    if (gameError || !game) {
      console.error('Failed to create game:', gameError);
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabaseAdmin
      .from('audit_trail')
      .insert({
        event_type: 'game_created',
        entity_type: 'game',
        entity_id: game.id,
        user_id: user.id,
        metadata: {
          class_id: classId,
          class_title: classData.title,
          game_title: title,
          difficulty,
          is_public: is_public || false,
        }
      });

    return NextResponse.json({
      id: game.id,
      created_at: game.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error('Games API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
