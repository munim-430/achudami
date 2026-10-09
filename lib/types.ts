export interface StudentRecord {
  slNo: number | string;
  studentId: string;
  applicantName: string;
  dobFormatted: string;
  applyingCourse: string;
  degreeProgram: string;
  educationPeriod: string;
  koreanSemesterYear: string;
  englishSemesterYear: string;
  degreeStartYear: string;
  issueDate: string;
  institution: string;
  filename: string;
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
