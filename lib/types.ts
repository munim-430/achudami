export type UniversityId = "hanyang" | "korea" | "skku";

export interface UniversityConfig {
  id: UniversityId;
  name: string;
  koreanName: string;
  badge: string;
  tagline: string;
  defaultTemplatePath: string;
  sampleExcelFilename: string;
}

export const UNIVERSITIES: Record<UniversityId, UniversityConfig> = {
  hanyang: {
    id: "hanyang",
    name: "Hanyang University",
    koreanName: "한양대학교",
    badge: "HYU",
    tagline: "Confirmation of Acceptance (한양대학교 국제교육원)",
    defaultTemplatePath: "/assets/clean_base_template.pdf",
    sampleExcelFilename: "Hanyang_Acceptance_Sample_Intake.xlsx",
  },
  korea: {
    id: "korea",
    name: "Korea University",
    koreanName: "고려대학교",
    badge: "KU",
    tagline: "Letter of Acceptance / 합격통지서 (한국어센터 KLC)",
    defaultTemplatePath: "/assets/clean_ku_template.pdf",
    sampleExcelFilename: "Korea_Univ_Acceptance_Sample_Intake.xlsx",
  },
  skku: {
    id: "skku",
    name: "Sungkyunkwan University",
    koreanName: "성균관대학교",
    badge: "SKKU",
    tagline: "Confirmation of Acceptance (성균어학원 SLI)",
    defaultTemplatePath: "/assets/clean_skku_template.pdf",
    sampleExcelFilename: "SKKU_Acceptance_Sample_Intake.xlsx",
  },
};

export interface StudentRecord {
  slNo: number | string;
  studentId: string;
  applicantName: string;
  dobFormatted: string; // Formatted per university
  dobRaw?: string;      // YYYY-MM-DD or DD-MM-YYYY
  applyingCourse: string;
  degreeProgram: string;
  educationPeriod: string;
  koreanSemesterYear: string;   // e.g. "2025" or "2026"
  englishSemesterYear: string;  // e.g. "2025 Winter" or "2026 Winter Regular Program"
  degreeStartYear: string;      // e.g. "2026-09-01" or "01 march, 2027"
  issueDate: string;            // e.g. "2026-10-06" or "2026년 10월 06일"
  institution: string;
  filename: string;

  // University-specific optional fields
  nationality?: string;          // SKKU (default: Bangladesh)
  referenceNo?: string;          // KU reference e.g. KU KLC-2026-10-06-001
  admissionDate?: string;        // SKKU admission date
  sessionTuition?: string;       // SKKU e.g. "1,750,000"
}

export interface GenerationProgress {
  current: number;
  total: number;
  currentName: string;
  isGenerating: boolean;
  error: string | null;
}

export interface GeneratedCertificate {
  filename: string;
  studentId: string;
  applicantName: string;
  pdfBytes: Uint8Array;
  blobUrl: string;
}
