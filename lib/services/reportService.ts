import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillRecord = {
  subject_area: string;
  skill_code: string | null;
  skill_name: string;
  proficiency_level: string | null;
  evidence_notes: string | null;
  assessed_at: string;
};

type WorksheetLog = {
  subject_area: string;
  standards: string[];
  score: number | null;
  completed_at: string;
};

type AssessmentRecord = {
  subject_area: string;
  assessment_period: string | null;
  narrative: string | null;
  standards: string[];
  created_at: string;
};

export type QuarterlyReportData = {
  student: {
    id: string;
    display_name: string;
    grade_level: string | null;
  };
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  skills: SkillRecord[];
  worksheetLogs: WorksheetLog[];
  assessments: AssessmentRecord[];
};

// ─── JSON builder ─────────────────────────────────────────────────────────────

export function buildQuarterlyReportJson(data: QuarterlyReportData) {
  return {
    student: data.student,
    reporting_period: {
      year: data.year,
      quarter: data.quarter,
    },
    summary: {
      skill_count: data.skills.length,
      worksheet_count: data.worksheetLogs.length,
      assessment_count: data.assessments.length,
    },
    skills: data.skills,
    worksheet_logs: data.worksheetLogs,
    assessments: data.assessments,
    disclaimer:
      'This Renaissance Kids progress report is designed to support homeschool documentation. ' +
      'Families remain responsible for confirming district-specific requirements.',
  };
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

export function buildQuarterlyReportPdf(data: QuarterlyReportData): ArrayBuffer {
  const doc = new jsPDF();
  const report = buildQuarterlyReportJson(data);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(47, 107, 101); // rk-green
  doc.setFontSize(18);
  doc.text('Renaissance Kids Quarterly Progress Report', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(45, 45, 45);
  doc.setFontSize(11);
  doc.text(`Student: ${data.student.display_name}`, 14, 30);
  doc.text(`Grade Level: ${data.student.grade_level ?? 'Not specified'}`, 14, 37);
  doc.text(`Reporting Period: ${data.quarter} ${data.year}`, 14, 44);

  // Skills table
  autoTable(doc, {
    startY: 54,
    head: [['Subject', 'Skill', 'Proficiency', 'Evidence']],
    body: data.skills.map((skill) => [
      skill.subject_area,
      skill.skill_code
        ? `${skill.skill_code}: ${skill.skill_name}`
        : skill.skill_name,
      skill.proficiency_level ?? 'Not recorded',
      skill.evidence_notes ?? 'No notes recorded',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [47, 107, 101] },
  });

  type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };
  const docExt = doc as DocWithAutoTable;

  // Worksheet logs table
  autoTable(doc, {
    startY: docExt.lastAutoTable?.finalY
      ? docExt.lastAutoTable.finalY + 10
      : 120,
    head: [['Subject', 'Standards', 'Score', 'Completed']],
    body: data.worksheetLogs.map((log) => [
      log.subject_area,
      log.standards.join(', ') || 'Not specified',
      log.score == null ? 'Not scored' : String(log.score),
      new Date(log.completed_at).toLocaleDateString('en-US'),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 90, 34] }, // rk-orange
  });

  // Disclaimer footer
  const finalY = docExt.lastAutoTable?.finalY ?? 220;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(report.disclaimer, 14, Math.min(finalY + 14, 280), {
    maxWidth: 180,
  });

  return doc.output('arraybuffer');
}
