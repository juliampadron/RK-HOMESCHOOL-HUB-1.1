import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface QuarterlyReportRequest {
  studentId: string;
  quarter: string; // Q1, Q2, Q3, Q4
  year: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuarterlyReportRequest = await request.json();
    const { studentId, quarter, year } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch student and family data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, profiles(*), families(*)')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Determine date range for quarter
    const quarterDates = getQuarterDateRange(quarter, year);

    // Fetch enrollments for the quarter
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, classes(*, profiles(full_name))')
      .eq('student_id', studentId)
      .gte('enrollment_date', quarterDates.start)
      .lte('enrollment_date', quarterDates.end);

    // Fetch portfolio items for the quarter
    const { data: portfolioItems } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('student_id', studentId)
      .gte('date_completed', quarterDates.start)
      .lte('date_completed', quarterDates.end);

    // Fetch progress data for the quarter
    const { data: progressData } = await supabase
      .from('student_progress')
      .select('*, games(title, subject_area, nys_standards)')
      .eq('student_id', studentId)
      .gte('last_played_at', quarterDates.start)
      .lte('last_played_at', quarterDates.end);

    // Generate PDF report
    const pdfBuffer = await generateQuarterlyReportPDF({
      student,
      quarter,
      year,
      enrollments: enrollments || [],
      portfolioItems: portfolioItems || [],
      progressData: progressData || [],
    });

    // Upload PDF to Supabase Storage
    const fileName = `quarterly-report-${studentId}-${year}-${quarter}.pdf`;
    const filePath = `reports/${student.families.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('district-reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('district-reports')
      .getPublicUrl(filePath);

    // Create or update quarterly report record
    const reportData = {
      student_id: studentId,
      family_id: student.family_id,
      quarter,
      year,
      report_data: {
        enrollments: enrollments?.length || 0,
        portfolioItems: portfolioItems?.length || 0,
        gamesPlayed: progressData?.length || 0,
        subjects: Array.from(new Set([
          ...(enrollments?.map(e => e.classes.subject_area) || []),
          ...(portfolioItems?.map(p => p.subject_area) || []),
        ])),
      },
      pdf_url: publicUrl,
      submitted_at: new Date().toISOString(),
    };

    const { data: report, error: reportError } = await supabase
      .from('quarterly_reports')
      .upsert(reportData, {
        onConflict: 'student_id,quarter,year',
      })
      .select()
      .single();

    if (reportError) {
      console.error('Database error creating report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create report record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      pdfUrl: publicUrl,
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getQuarterDateRange(quarter: string, year: number) {
  const quarters: Record<string, { start: string; end: string }> = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };

  return quarters[quarter] || quarters.Q1;
}

async function generateQuarterlyReportPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    const { student, quarter, year, enrollments, portfolioItems, progressData } = data;

    // Header
    doc
      .fontSize(24)
      .fillColor('#2F6B65')
      .text('Renaissance Kids Homeschool Hub', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(18)
      .text(`Quarterly Learning Report - ${quarter} ${year}`, { align: 'center' })
      .moveDown(2);

    // Student Information
    doc
      .fontSize(14)
      .fillColor('#000000')
      .text('Student Information', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .text(`Name: ${student.profiles.full_name}`)
      .text(`Grade Level: ${student.grade_level}`)
      .text(`Family: ${student.families.family_name}`)
      .text(`District: ${student.families.district || 'N/A'}`)
      .moveDown(1.5);

    // Class Enrollments
    doc
      .fontSize(14)
      .fillColor('#2F6B65')
      .text('Classes Enrolled', { underline: true })
      .moveDown(0.5);

    if (enrollments.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No class enrollments this quarter').moveDown(1);
    } else {
      enrollments.forEach((enrollment: any, index: number) => {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(`${index + 1}. ${enrollment.classes.title}`, { continued: true })
          .fillColor('#666666')
          .text(` - ${enrollment.classes.subject_area}`)
          .fontSize(10)
          .text(`   Instructor: ${enrollment.classes.profiles.full_name}`)
          .text(`   Status: ${enrollment.status}`)
          .moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Portfolio Items
    doc
      .fontSize(14)
      .fillColor('#2F6B65')
      .text('Portfolio Work Samples', { underline: true })
      .moveDown(0.5);

    if (portfolioItems.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No portfolio items this quarter').moveDown(1);
    } else {
      portfolioItems.forEach((item: any, index: number) => {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(`${index + 1}. ${item.title}`, { continued: true })
          .fillColor('#666666')
          .text(` - ${item.subject_area}`)
          .fontSize(10)
          .text(`   Type: ${item.item_type}`)
          .text(`   Date: ${new Date(item.date_completed).toLocaleDateString()}`)

        if (item.nys_standards && item.nys_standards.length > 0) {
          doc.text(`   Standards: ${item.nys_standards.join(', ')}`);
        }

        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Learning Games Progress
    doc
      .fontSize(14)
      .fillColor('#2F6B65')
      .text('Learning Games Activity', { underline: true })
      .moveDown(0.5);

    if (progressData.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No game activity this quarter').moveDown(1);
    } else {
      // Summarize games by subject
      const gamesBySubject: Record<string, any[]> = {};
      progressData.forEach((progress: any) => {
        const subject = progress.games.subject_area || 'Other';
        if (!gamesBySubject[subject]) {
          gamesBySubject[subject] = [];
        }
        gamesBySubject[subject].push(progress);
      });

      Object.entries(gamesBySubject).forEach(([subject, games]) => {
        doc
          .fontSize(12)
          .fillColor('#000000')
          .text(`${subject}:`)
          .fontSize(10);

        games.forEach((progress: any) => {
          doc
            .fillColor('#000000')
            .text(`  • ${progress.games.title}`, { continued: true })
            .fillColor('#666666')
            .text(` - Score: ${progress.score}, Completion: ${progress.completion_percentage}%`);
        });

        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Summary Statistics
    doc.addPage();
    doc
      .fontSize(14)
      .fillColor('#2F6B65')
      .text('Quarterly Summary', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor('#000000')
      .text(`Total Classes: ${enrollments.length}`)
      .text(`Total Portfolio Items: ${portfolioItems.length}`)
      .text(`Total Learning Games Played: ${progressData.length}`)
      .moveDown(1);

    // NYS Standards Covered
    const standardsCovered = new Set();
    portfolioItems.forEach((item: any) => {
      if (item.nys_standards) {
        item.nys_standards.forEach((std: string) => standardsCovered.add(std));
      }
    });
    progressData.forEach((progress: any) => {
      if (progress.games.nys_standards) {
        progress.games.nys_standards.forEach((std: string) => standardsCovered.add(std));
      }
    });

    if (standardsCovered.size > 0) {
      doc
        .fontSize(14)
        .fillColor('#2F6B65')
        .text('NYS Learning Standards Addressed', { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#000000')
        .text(Array.from(standardsCovered).join(', '))
        .moveDown(1.5);
    }

    // Footer
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(
        `Report generated on ${new Date().toLocaleDateString()} for ${student.families.district || 'Homeschool'} District`,
        { align: 'center' }
      )
      .text('Renaissance Kids Homeschool Hub • renkids.org • (845) 452-4225', { align: 'center' });

    doc.end();
  });
}

// Storage bucket setup SQL (run in Supabase)
/*
-- Create storage bucket for district reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('district-reports', 'district-reports', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Families can upload their own reports
CREATE POLICY "Families can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'district-reports' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM families
    WHERE primary_contact_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Policy: Families and district viewers can read reports
CREATE POLICY "Reports viewable by families and district"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'district-reports' AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM families
      WHERE id IN (
        SELECT family_id FROM family_memberships
        WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'district_viewer'))
  )
);
*/
