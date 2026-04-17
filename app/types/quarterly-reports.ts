// Type definitions for quarterly report data structures

export interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_initial: string;
  grade_band: string;
  parent_guardian_name: string;
  district: string;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Class {
  id: string;
  title: string;
  subject_area: SubjectArea;
  instructor_id: string | null;
  instructor?: Instructor;
  created_at: string;
}

export type SubjectArea =
  | 'Mathematics'
  | 'Science'
  | 'English Language Arts'
  | 'Visual Arts'
  | 'Music'
  | 'Social Studies'
  | 'Physical Education';

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: 'active' | 'completed' | 'withdrawn';
  class?: Class;
  created_at: string;
}

export interface HoursLog {
  id: string;
  enrollment_id: string;
  date: string;
  hours: number;
  description: string | null;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  student_id: string;
  class_id: string | null;
  title: string;
  type: 'essay' | 'lab_report' | 'artwork' | 'project';
  submitted_date: string;
  nys_standard: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  created_at: string;
}

export interface NYSStandardMet {
  id: string;
  student_id: string;
  standard_code: string;
  standard_description: string;
  subject_area: SubjectArea;
  quarter: Quarter;
  year: number;
  evidence_type: 'portfolio' | 'assessment' | 'observation' | null;
  evidence_id: string | null;
  created_at: string;
}

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface InstructorFeedback {
  id: string;
  enrollment_id: string;
  instructor_id: string | null;
  instructor?: Instructor;
  quarter: Quarter;
  year: number;
  feedback_text: string;
  created_at: string;
}

export interface QuarterlyReport {
  id: string;
  student_id: string;
  quarter: Quarter;
  year: number;
  report_period_start: string;
  report_period_end: string;
  generated_date: string;
  generated_by: string | null;
  file_url: string;
  total_hours: number | null;
  classes_enrolled: number | null;
  instructors_count: number | null;
  created_at: string;
}

export interface GameActivity {
  id: string;
  student_id: string;
  game_name: string;
  subject_area: SubjectArea;
  date_played: string;
  duration_minutes: number | null;
  score: number | null;
  created_at: string;
}

// API request/response types

export interface GenerateReportRequest {
  studentId: string;
  quarter: Quarter;
  year: number;
}

export interface GenerateReportResponse {
  success: boolean;
  reportUrl: string;
  reportId: string;
  data: QuarterlyReportData;
}

export interface QuarterlyReportData {
  student: {
    firstName: string;
    lastInitial: string;
    grade: string;
    parentGuardian: string;
    district: string;
  };
  reportPeriod: {
    quarter: Quarter;
    year: number;
    startDate: string;
    endDate: string;
    generatedDate: string;
  };
  summary: {
    totalHours: number;
    classesEnrolled: number;
    instructorsCount: number;
  };
  subjects: Array<{
    name: string;
    hours: number;
    classes: Array<{
      title: string;
      instructor: string;
    }>;
    games?: string[];
    portfolioCount?: number;
  }>;
  standards: Array<{
    subject: string;
    items: Array<{
      code: string;
      description: string;
    }>;
  }>;
  portfolio: Array<{
    title: string;
    submittedDate: string;
    standard: string;
    type: string;
  }>;
  instructorFeedback: Array<{
    instructor: string;
    subject: string;
    feedback: string;
  }>;
}

export interface ListReportsResponse {
  reports: QuarterlyReport[];
}

// Database helper types

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>;
      };
      instructors: {
        Row: Instructor;
        Insert: Omit<Instructor, 'id' | 'created_at'>;
        Update: Partial<Omit<Instructor, 'id' | 'created_at'>>;
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, 'id' | 'created_at'>;
        Update: Partial<Omit<Class, 'id' | 'created_at'>>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, 'id' | 'created_at'>;
        Update: Partial<Omit<Enrollment, 'id' | 'created_at'>>;
      };
      hours_log: {
        Row: HoursLog;
        Insert: Omit<HoursLog, 'id' | 'created_at'>;
        Update: Partial<Omit<HoursLog, 'id' | 'created_at'>>;
      };
      portfolio_items: {
        Row: PortfolioItem;
        Insert: Omit<PortfolioItem, 'id' | 'created_at'>;
        Update: Partial<Omit<PortfolioItem, 'id' | 'created_at'>>;
      };
      nys_standards_met: {
        Row: NYSStandardMet;
        Insert: Omit<NYSStandardMet, 'id' | 'created_at'>;
        Update: Partial<Omit<NYSStandardMet, 'id' | 'created_at'>>;
      };
      instructor_feedback: {
        Row: InstructorFeedback;
        Insert: Omit<InstructorFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<InstructorFeedback, 'id' | 'created_at'>>;
      };
      quarterly_reports: {
        Row: QuarterlyReport;
        Insert: Omit<QuarterlyReport, 'id' | 'created_at'>;
        Update: Partial<Omit<QuarterlyReport, 'id' | 'created_at'>>;
      };
      game_activity: {
        Row: GameActivity;
        Insert: Omit<GameActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<GameActivity, 'id' | 'created_at'>>;
      };
    };
  };
}
