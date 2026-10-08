import {
  analyzePdfDocument,
  extractHanyangFieldLocations,
  HanyangFieldLocations,
} from '../pdf/analyzer';
import {
  replaceHanyangPdf,
  HanyangReplacementValues,
  ReplaceHanyangPdfResult,
} from '../pdf/replacer';
import { validateHanyangPdf, ValidationResult } from '../pdf/validation';
import { checkTimesNewRomanAvailable } from '../pdf/fontLoader';

export interface HanyangTemplateValues {
  applyingCourse: string;
  educationPeriod: string;
  englishCertText: string;
}

export const HANYANG_DEFAULT_VALUES: HanyangTemplateValues = {
  applyingCourse: 'Korean Language Course\nBachelor of Business Administration',
  educationPeriod: '2026.12.02.-2032.09.01',
  englishCertText:
    'This is to Certify that the applicant named above has been admitted to the Korean Language Course of Hanyang University Institute of International Education for 2026 Winter semester. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01',
};

export const HANYANG_TEXT_MARKERS: string[] = [
  '한양대학교 국제교육원',
  'Hanyang University Institute of International Education',
  'Confirmation of Acceptance',
  'Studnet ID No.',
  '지원과정',
  '교육기간',
];

export interface ProcessHanyangResult {
  pdfBytes: Uint8Array;
  blobUrl: string;
  processingTimeMs: number;
  validation: ValidationResult;
  locations: HanyangFieldLocations;
}

/**
 * Checks if the extracted PDF text matches the Hanyang University Confirmation of Acceptance template.
 */
export function isHanyangTemplate(text: string): boolean {
  if (!text) return false;
  let matches = 0;
  for (const marker of HANYANG_TEXT_MARKERS) {
    if (text.includes(marker)) {
      matches++;
    }
  }
  // Matches if at least 2 distinct Hanyang markers are present
  return (
    matches >= 2 ||
    text.includes('Hanyang University') ||
    text.includes('한양대학교')
  );
}

/**
 * Isolated Hanyang template handler. Executes complete pipeline:
 * 1. Analysis of uploaded PDF
 * 2. Automatic field and baseline detection
 * 3. Whiteout and redraw with Times New Roman TTF
 * 4. Validation against locked and edited fields
 */
export async function handleHanyangTemplate(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  values: HanyangTemplateValues = HANYANG_DEFAULT_VALUES
): Promise<ProcessHanyangResult> {
  // 1. Analyze PDF structure and detect field locations
  const analysis = await analyzePdfDocument(originalPdfBytes);
  const locations = extractHanyangFieldLocations(analysis);

  // 2. Execute replacement using Times New Roman TTF
  const replaceResult: ReplaceHanyangPdfResult = await replaceHanyangPdf(
    originalPdfBytes,
    values,
    locations
  );

  // 3. Verify font availability
  const isFontAvailable = await checkTimesNewRomanAvailable();

  // 4. Validate output before download
  const validation = await validateHanyangPdf(
    replaceResult.pdfBytes,
    values,
    locations,
    isFontAvailable
  );

  return {
    pdfBytes: replaceResult.pdfBytes,
    blobUrl: replaceResult.blobUrl,
    processingTimeMs: replaceResult.processingTimeMs,
    validation,
    locations,
  };
}
