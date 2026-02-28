import jsPDF from "jspdf";

export interface QuarterlyReport {
  student_id: string;
  year: number;
  quarter: number;
  period: { start: string; end: string };
  skills: SkillRecord[];
  assessments: AssessmentRecord[];
  worksheets: WorksheetRecord[];
  summary: ReportSummary;
  ihip_compliant: boolean;
  generated_at: string;
}

interface SkillRecord {
  id: number;
  standard_code: string;
  subject: string;
  grade_level: string;
  skill_name: string;
  mastery_level: string;
  last_assessed_at: string | null;
}

interface AssessmentRecord {
  id: number;
  subject: string;
  grade_level: string;
  title: string;
  assessment_type: string;
  score_percentage: number | null;
  mastery_determination: string | null;
  assessed_at: string;
}

interface WorksheetRecord {
  id: number;
  template_id: string;
  subject: string;
  difficulty_level: string;
  status: string;
  score_percentage: number | null;
  completed_at: string | null;
}

interface ReportSummary {
  total_skills_tracked: number;
  total_assessments: number;
  total_worksheets_completed: number;
  average_assessment_score: number | null;
}

const BRAND_ORANGE = "#F05A22";
const BRAND_BLUE = "#2B59C3";
const PAGE_MARGIN = 15;

function addPageHeader(doc: jsPDF, title: string, subtitle: string): number {
  doc.setFillColor(BRAND_ORANGE);
  doc.rect(0, 0, 216, 18, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Renaissance Kids Homeschool Hub", PAGE_MARGIN, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("NYS IHIP Compliance Report", 216 - PAGE_MARGIN, 11, { align: "right" });

  let y = 26;
  doc.setTextColor(BRAND_BLUE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, PAGE_MARGIN, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#444444");
  doc.text(subtitle, PAGE_MARGIN, y);
  y += 8;
  doc.setDrawColor(BRAND_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, y, 216 - PAGE_MARGIN, y);
  return y + 6;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_BLUE);
  doc.text(title, PAGE_MARGIN, y);
  return y + 6;
}

function addKeyValue(
  doc: jsPDF,
  key: string,
  value: string,
  y: number
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#333333");
  doc.text(`${key}:`, PAGE_MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, PAGE_MARGIN + 40, y);
  return y + 6;
}

export async function generateQuarterlyReportPdf(
  report: QuarterlyReport
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "letter" });

  const title = `IHIP Quarterly Report — Q${report.quarter} ${report.year}`;
  const subtitle = `Period: ${report.period.start} to ${report.period.end}`;
  let y = addPageHeader(doc, title, subtitle);

  // Student & report info
  y = addSectionTitle(doc, "Report Information", y);
  y = addKeyValue(doc, "Student ID", report.student_id, y);
  y = addKeyValue(doc, "Academic Year", String(report.year), y);
  y = addKeyValue(doc, "Quarter", String(report.quarter), y);
  y = addKeyValue(
    doc,
    "IHIP Compliant",
    report.ihip_compliant ? "Yes" : "No",
    y
  );
  y = addKeyValue(
    doc,
    "Generated",
    new Date(report.generated_at).toLocaleString(),
    y
  );
  y += 4;

  // Summary
  y = addSectionTitle(doc, "Summary", y);
  y = addKeyValue(
    doc,
    "Skills Tracked",
    String(report.summary.total_skills_tracked),
    y
  );
  y = addKeyValue(
    doc,
    "Assessments",
    String(report.summary.total_assessments),
    y
  );
  y = addKeyValue(
    doc,
    "Worksheets Completed",
    String(report.summary.total_worksheets_completed),
    y
  );
  y = addKeyValue(
    doc,
    "Avg Assessment Score",
    report.summary.average_assessment_score !== null
      ? `${report.summary.average_assessment_score}%`
      : "N/A",
    y
  );
  y += 4;

  // Skills
  if (report.skills.length > 0) {
    y = addSectionTitle(doc, "Skill Mastery Overview", y);
    for (const skill of report.skills) {
      if (y > 260) {
        doc.addPage();
        y = addPageHeader(doc, title, subtitle);
      }
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#333333");
      doc.text(
        `• [${skill.standard_code}] ${skill.skill_name} — ${skill.mastery_level.replace("_", " ")}`,
        PAGE_MARGIN,
        y
      );
      y += 5;
    }
    y += 3;
  }

  // Assessments
  if (report.assessments.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = addPageHeader(doc, title, subtitle);
    }
    y = addSectionTitle(doc, "Assessments", y);
    for (const assessment of report.assessments) {
      if (y > 260) {
        doc.addPage();
        y = addPageHeader(doc, title, subtitle);
      }
      const score =
        assessment.score_percentage !== null
          ? `${assessment.score_percentage}%`
          : "N/A";
      const mastery = assessment.mastery_determination ?? "N/A";
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#333333");
      doc.text(
        `• ${assessment.title} (${assessment.subject}) — Score: ${score}, Mastery: ${mastery}`,
        PAGE_MARGIN,
        y
      );
      y += 5;
    }
    y += 3;
  }

  // Worksheets
  if (report.worksheets.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = addPageHeader(doc, title, subtitle);
    }
    y = addSectionTitle(doc, "Worksheet Activity", y);
    for (const worksheet of report.worksheets) {
      if (y > 260) {
        doc.addPage();
        y = addPageHeader(doc, title, subtitle);
      }
      const score =
        worksheet.score_percentage !== null
          ? `${worksheet.score_percentage}%`
          : "N/A";
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#333333");
      doc.text(
        `• ${worksheet.template_id} (${worksheet.subject}, ${worksheet.difficulty_level}) — Status: ${worksheet.status}, Score: ${score}`,
        PAGE_MARGIN,
        y
      );
      y += 5;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor("#888888");
    doc.text(
      `© ${new Date().getFullYear()} Renaissance Kids  |  Page ${i} of ${pageCount}`,
      216 / 2,
      279,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
