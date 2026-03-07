import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyUser } from '@/app/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const { user, error: authError } = await verifyUser(authHeader);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify student belongs to authenticated user
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name, parent_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if user owns this student
    if (student.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get enrollments with class details
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        hours_completed,
        status,
        class_id,
        classes!inner(
          title
        )
      `)
      .eq('student_id', studentId);

    if (enrollmentsError) {
      console.error('Failed to fetch enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Get games unlocked (count of games accessed through enrollments)
    const enrollmentIds = enrollments.map(e => e.id);
    let gamesUnlocked = 0;

    if (enrollmentIds.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from('student_progress')
        .select('game_id', { count: 'exact', head: false })
        .eq('student_id', studentId)
        .not('game_id', 'is', null);

      if (progressData) {
        // Count unique game IDs
        const uniqueGameIds = new Set(progressData.map(p => p.game_id));
        gamesUnlocked = uniqueGameIds.size;
      }
    }

    // Get portfolio items count
    const { count: portfolioCount } = await supabaseAdmin
      .from('portfolio_items')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);

    // Format enrollments data
    const enrollmentsData = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        // Count games unlocked for this specific enrollment
        const { data: enrollmentGames } = await supabaseAdmin
          .from('student_progress')
          .select('game_id', { count: 'exact', head: false })
          .eq('enrollment_id', enrollment.id)
          .not('game_id', 'is', null);

        const uniqueGamesForEnrollment = enrollmentGames
          ? new Set(enrollmentGames.map(p => p.game_id)).size
          : 0;

        // Count portfolio items for this enrollment
        const { count: enrollmentPortfolioCount } = await supabaseAdmin
          .from('portfolio_items')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('enrollment_id', enrollment.id);

        return {
          class_title: enrollment.classes.title,
          hours_completed: Number(enrollment.hours_completed) || 0,
          games_unlocked: uniqueGamesForEnrollment,
          portfolio_items: enrollmentPortfolioCount || 0,
        };
      })
    );

    // Calculate total hours across all enrollments
    const totalHours = enrollments.reduce(
      (sum, e) => sum + (Number(e.hours_completed) || 0),
      0
    );

    // Get subjects covered from active enrollments
    const { data: activeClasses } = await supabaseAdmin
      .from('enrollments')
      .select(`
        classes!inner(
          subject_area
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    const subjectsCovered = activeClasses
      ? [...new Set(activeClasses.map((c: any) => c.classes.subject_area).filter(Boolean))]
      : [];

    // NYS compliance check (example: quarterly report ready if >= 40 hours)
    const quarterlyReady = totalHours >= 40 && subjectsCovered.length >= 3;

    return NextResponse.json({
      student: {
        id: student.id,
        first_name: student.first_name,
      },
      enrollments: enrollmentsData,
      nys_compliance: {
        total_hours: totalHours,
        subjects_covered: subjectsCovered,
        quarterly_ready: quarterlyReady,
      },
    });
  } catch (error) {
    console.error('Student progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
