import {
  KU_TARGET_FIELDS_CONFIG,
  DEFAULT_FORM_VALUES,
  modifyKoreaUniversityPdf,
  ModifyPdfOptions,
  ModifyPdfResult,
  PDFModifierFormValues,
} from '../pdf-utils';

export interface KoreaTemplateValues {
  course: string;
  studyPeriod: string;
  certText: string;
}

export const KOREA_DEFAULT_VALUES: KoreaTemplateValues = { ...DEFAULT_FORM_VALUES };

export const KOREA_TEXT_MARKERS: string[] = [
  '고려대학교',
  'Korea University',
  'Letter of Acceptance',
  '합격통지서',
  'KU KLC',
];

/**
 * Checks if the extracted PDF text matches the Korea University Letter of Acceptance template.
 */
export function isKoreaTemplate(text: string): boolean {
  if (!text) return false;
  let matches = 0;
  for (const marker of KOREA_TEXT_MARKERS) {
    if (text.includes(marker)) {
      matches++;
    }
  }
  return (
    matches >= 2 ||
    text.includes('Korea University') ||
    text.includes('고려대학교') ||
    text.includes('KU KLC')
  );
}

/**
 * Isolated Korea University template handler.
 */
export async function handleKoreaTemplate(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  values: KoreaTemplateValues = KOREA_DEFAULT_VALUES,
  debugMode: boolean = false
): Promise<ModifyPdfResult> {
  return await modifyKoreaUniversityPdf({
    originalPdfBytes,
    values,
    debugMode,
  });
}
