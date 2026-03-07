import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectArea = searchParams.get('subject_area');
    const gradeBand = searchParams.get('grade_band');
    const status = searchParams.get('status') || 'active';

    // Build query
    let query = supabaseAdmin
      .from('classes')
      .select(`
        id,
        title,
        description,
        price_cents,
        schedule,
        subject_area,
        grade_band,
        max_students,
        current_enrollment,
        instructor_profiles!inner(
          id,
          full_name,
          approved
        )
      `)
      .eq('status', status)
      .eq('instructor_profiles.approved', true);

    // Apply filters
    if (subjectArea) {
      query = query.eq('subject_area', subjectArea);
    }

    if (gradeBand) {
      query = query.eq('grade_band', gradeBand);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Failed to fetch classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    // Format response
    const formattedClasses = classes.map((classItem: any) => ({
      id: classItem.id,
      title: classItem.title,
      description: classItem.description,
      price_cents: classItem.price_cents,
      instructor: {
        id: classItem.instructor_profiles.id,
        full_name: classItem.instructor_profiles.full_name,
      },
      schedule: classItem.schedule,
      subject_area: classItem.subject_area,
      grade_band: classItem.grade_band,
      max_students: classItem.max_students,
      current_enrollment: classItem.current_enrollment,
    }));

    return NextResponse.json({
      classes: formattedClasses
    });
  } catch (error) {
    console.error('Classes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
