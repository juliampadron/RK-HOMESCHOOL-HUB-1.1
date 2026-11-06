import jsPDF from "jspdf";

export interface QuarterlyProgressReport {
  student: {
    id: string;
    displayName: string;
    gradeBand: string;
    parentGuardian: string;
    district: string;
  };
  report: {
    year: number;
    quarter: number;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
  };
  summary: {
    totalHours: number;
    classesEnrolled: number;
    instructors: number;
  };
  subjects: SubjectBreakdown[];
  standardsBySubject: StandardsBySubject[];
  portfolioItems: PortfolioItem[];
  instructorFeedback: InstructorFeedback[];
  portfolioUrl?: string;
}

export interface SubjectBreakdown {
  subject: string;
  hours: number;
  classHighlights: string[];
}

export interface StandardsBySubject {
  subject: string;
  standards: Array<{ code: string; description: string }>;
}

export interface PortfolioItem {
  title: string;
  submittedAt: string;
  standard: string;
}

export interface InstructorFeedback {
  instructor: string;
  subject: string;
  note: string;
}

const PAGE_WIDTH = 216;
const PAGE_HEIGHT = 279;
const MARGIN = 16;
const RK_ORANGE: [number, number, number] = [240, 90, 34];
const RK_BLUE: [number, number, number] = [43, 89, 195];

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function quarterLabel(quarter: number, year: number): string {
  return `Q${quarter} ${year}`;
}

function setBrandHeader(doc: jsPDF, title: string, subtitle: string): void {
  doc.setFillColor(...RK_ORANGE);
  doc.rect(0, 0, PAGE_WIDTH, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Renaissance Kids Logo", MARGIN, 12);
  doc.setFontSize(13);
  doc.text(title, PAGE_WIDTH - MARGIN, 10, { align: "right" });
  doc.setFontSize(10);
  doc.text(subtitle, PAGE_WIDTH - MARGIN, 15, { align: "right" });
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(...RK_BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text.toUpperCase(), MARGIN, y);
  y += 3;
  doc.setDrawColor(...RK_BLUE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 6;
}

function kv(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${label}:`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, MARGIN + 42, y);
  return y + 6;
}

function addPageFooter(doc: jsPDF, page: number, totalPages: number): void {
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(
    `Renaissance Kids, Inc. • 1343 Route 44, Pleasant Valley, NY 12569 • (845) 452-4225 • www.renkids.org • Page ${page}/${totalPages}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 6,
    { align: "center" }
  );
}

function addPageOne(doc: jsPDF, report: QuarterlyProgressReport): void {
  setBrandHeader(doc, "QUARTERLY HOMESCHOOL", "PROGRESS REPORT");
  let y = 30;

  y = kv(
    doc,
    "Report Period",
    `${quarterLabel(report.report.quarter, report.report.year)} (${formatDate(report.report.periodStart)} - ${formatDate(report.report.periodEnd)})`,
    y
  );
  y = kv(doc, "Generated", formatDate(report.report.generatedAt), y);

  y += 6;
  y = sectionTitle(doc, "Student Information", y);
  y = kv(doc, "Name", report.student.displayName, y);
  y = kv(doc, "Grade", report.student.gradeBand, y);
  y = kv(doc, "Parent/Guardian", report.student.parentGuardian, y);
  y = kv(doc, "District", report.student.district, y);

  y += 4;
  y = sectionTitle(doc, "Instruction Summary", y);
  y = kv(doc, "Total Hours This Quarter", `${report.summary.totalHours.toFixed(1)}`, y);
  y = kv(doc, "Classes Enrolled", `${report.summary.classesEnrolled}`, y);
  kv(doc, "Instructors", `${report.summary.instructors}`, y);
}

function addPageTwo(doc: jsPDF, report: QuarterlyProgressReport): void {
  setBrandHeader(doc, "SUBJECT AREA HOURS", "NYS Required Subjects");
  let y = 34;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const subject of report.subjects) {
    doc.setFont("helvetica", "bold");
    doc.text(subject.subject, MARGIN, y);
    doc.text(`${subject.hours.toFixed(1)} hours`, PAGE_WIDTH - MARGIN, y, {
      align: "right",
    });
    y += 6;
    doc.setFont("helvetica", "normal");
    subject.classHighlights.slice(0, 2).forEach((line) => {
      doc.text(`• ${line}`, MARGIN + 4, y);
      y += 5;
    });
    y += 3;
  }
}

function addPageThree(doc: jsPDF, report: QuarterlyProgressReport): void {
  setBrandHeader(doc, "NYS LEARNING STANDARDS", "Met This Quarter");
  let y = 34;

  report.standardsBySubject.forEach((group) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...RK_BLUE);
    doc.text(group.subject, MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    group.standards.forEach((standard) => {
      doc.text(`✓ ${standard.code}  ${standard.description}`, MARGIN + 2, y);
      y += 5;
    });
    y += 3;
  });
}

function addPageFour(doc: jsPDF, report: QuarterlyProgressReport): void {
  setBrandHeader(doc, "PORTFOLIO SUBMISSIONS", "Evidence of Learning");
  let y = 36;

  report.portfolioItems.slice(0, 6).forEach((item) => {
    doc.setDrawColor(200, 200, 200);
    doc.rect(MARGIN, y - 4, 20, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("[Thumbnail]", MARGIN + 1.5, y + 3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(item.title, MARGIN + 24, y + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Submitted: ${formatDate(item.submittedAt)}`, MARGIN + 24, y + 6);
    doc.text(`Standard: ${item.standard}`, MARGIN + 24, y + 11);

    y += 22;
  });

  y += 4;
  doc.setTextColor(...RK_BLUE);
  doc.text(`View full portfolio at: ${report.portfolioUrl ?? "renkids.org/portfolio"}`, MARGIN, y);
}

function addPageFive(doc: jsPDF, report: QuarterlyProgressReport): void {
  setBrandHeader(doc, "INSTRUCTOR FEEDBACK", "& Parent/Guardian Certification");
  let y = 36;

  report.instructorFeedback.slice(0, 3).forEach((feedback) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(`${feedback.instructor} (${feedback.subject}):`, MARGIN, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(`"${feedback.note}"`, PAGE_WIDTH - 2 * MARGIN);
    doc.text(lines, MARGIN + 2, y);
    y += lines.length * 4.2 + 5;
  });

  y = sectionTitle(doc, "Parent/Guardian Certification", y + 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  const cert =
    "I certify that the information in this report accurately reflects the educational instruction provided this quarter.";
  doc.text(doc.splitTextToSize(cert, PAGE_WIDTH - 2 * MARGIN), MARGIN, y);
  y += 14;
  doc.text("Signature: ________________________    Date: __________", MARGIN, y);
  y += 8;
  doc.text(`Print Name: ${report.student.parentGuardian}`, MARGIN, y);
}

export async function generateQuarterlyReportPdf(
  report: QuarterlyProgressReport
): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: "mm", format: "letter" });

  addPageOne(doc, report);
  doc.addPage();
  addPageTwo(doc, report);
  doc.addPage();
  addPageThree(doc, report);
  doc.addPage();
  addPageFour(doc, report);
  doc.addPage();
  addPageFive(doc, report);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages);
  }

  return doc.output("arraybuffer");
}
