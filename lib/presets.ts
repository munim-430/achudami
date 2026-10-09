import { CalibrationPreset, FieldBoundingBox, FieldValues } from './types';

/**
 * Verified, calibrated preset for Korea University Letter of Acceptance.
 * Uses strict hardcoded PDF coordinates for the target fields:
 * 1. Course Name (covers: "Korea University Korean Language Education Program")
 * 2. Study Period (covers: "DEC.2026 – NOV.2027")
 * 3. English Certificate Text (covers: "This is to certify that students who complete...")
 *
 * Leaves Name, DOB, Document ID, seals, and Korean paragraphs untouched.
 */
export const KU_ACCEPTANCE_LETTER_PRESET: CalibrationPreset = {
  id: 'ku-acceptance-letter',
  name: 'Korea University Letter of Acceptance (2nd English Para)',
  description:
    'Calibrated layout for KU Letter of Acceptance modifying Course Name, Study Period, and 2nd English Certificate Paragraph.',
  documentType: 'Admission Certificate',
  pageSize: {
    width: 595,
    height: 841,
  },
  boxes: [
    {
      id: 'field-course',
      name: 'Course Name',
      key: 'course',
      pageNumber: 1,
      x: 145.0,
      y: 546.0,
      width: 360.0,
      height: 18.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-study-period',
      name: 'Study Period',
      key: 'studyPeriod',
      pageNumber: 1,
      x: 270.0,
      y: 524.0,
      width: 150.0,
      height: 18.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-cert-text',
      name: 'English Certificate Text (2nd Paragraph)',
      key: 'certText',
      pageNumber: 1,
      x: 88.0,
      y: 254.0,
      width: 426.0,
      height: 64.0,
      fontSize: 10.5,
      lineHeight: 12.6,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: true,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
  ],
  defaultValues: {
    course:
      'Korea University Korean Language Education Bachelor of Business Administration Program',
    studyPeriod: 'DEC.2026 – SEP.2032',
    certText:
      'This is to certify that the above-mentioned student has been accepted into the Korean Language Program of the 2026 Winter Regular Program at Korea University Korean Language Center. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01',
  },
};

/**
 * Alternate preset for templates where the 1st English paragraph is targeted instead.
 */
export const KU_FIRST_PARAGRAPH_PRESET: CalibrationPreset = {
  id: 'ku-acceptance-letter-p1',
  name: 'Korea University Letter of Acceptance (1st English Para)',
  description:
    'Targets Course Name, Study Period, and 1st English Certificate Paragraph ("This is to certify that the above-mentioned student...").',
  documentType: 'Admission Certificate',
  pageSize: {
    width: 595,
    height: 841,
  },
  boxes: [
    {
      id: 'field-course',
      name: 'Course Name',
      key: 'course',
      pageNumber: 1,
      x: 145.0,
      y: 546.0,
      width: 360.0,
      height: 18.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-study-period',
      name: 'Study Period',
      key: 'studyPeriod',
      pageNumber: 1,
      x: 270.0,
      y: 524.0,
      width: 150.0,
      height: 18.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-cert-text',
      name: 'English Certificate Text (1st Paragraph)',
      key: 'certText',
      pageNumber: 1,
      x: 88.0,
      y: 365.0,
      width: 426.0,
      height: 55.0,
      fontSize: 10.5,
      lineHeight: 12.6,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: true,
      whiteoutPadding: 0,
      whiteoutColorHex: '#FFFFFF',
    },
  ],
  defaultValues: {
    course:
      'Korea University Korean Language Education Bachelor of Business Administration Program',
    studyPeriod: 'DEC.2026 – SEP.2032',
    certText:
      'This is to certify that the above-mentioned student has been accepted into the Korean Language Program of the 2026 Winter Regular Program at Korea University Korean Language Center. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01',
  },
};

export const DEFAULT_INITIAL_BOXES: FieldBoundingBox[] =
  KU_ACCEPTANCE_LETTER_PRESET.boxes;

export const DEFAULT_INITIAL_VALUES: FieldValues =
  KU_ACCEPTANCE_LETTER_PRESET.defaultValues;

export const ALL_PRESETS: CalibrationPreset[] = [
  KU_ACCEPTANCE_LETTER_PRESET,
  KU_FIRST_PARAGRAPH_PRESET,
];

export const DEFAULT_STARTER_TEMPLATE: CalibrationPreset = {
  id: 'custom-template',
  name: 'Custom University Acceptance Template',
  description: 'Custom 3-field template: Course Name, Study Period, and Certificate Paragraph.',
  documentType: 'Acceptance Certificate',
  pageSize: {
    width: 595,
    height: 841,
  },
  boxes: [
    {
      id: 'field-course',
      name: 'Course Name',
      key: 'course',
      pageNumber: 1,
      x: 140.0,
      y: 545.0,
      width: 360.0,
      height: 20.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 1,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-study-period',
      name: 'Study Period',
      key: 'studyPeriod',
      pageNumber: 1,
      x: 250.0,
      y: 520.0,
      width: 180.0,
      height: 18.0,
      fontSize: 10.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 1,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-cert-text',
      name: 'Certificate Paragraph',
      key: 'certText',
      pageNumber: 1,
      x: 88.0,
      y: 260.0,
      width: 420.0,
      height: 70.0,
      fontSize: 10.5,
      lineHeight: 13.0,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: true,
      whiteoutPadding: 1,
      whiteoutColorHex: '#FFFFFF',
    },
  ],
  defaultValues: {
    course: 'Korean Language Course / Bachelor Program',
    studyPeriod: '2026.12.02 – 2032.09.01',
    certText:
      'This is to certify that the above-mentioned student has been admitted to the designated academic program. This prerequisite program is designed to fulfill admission requirements starting from 2027.',
  },
};

export function createNewTemplateDraft(name: string = 'Untitled Custom Template'): CalibrationPreset {
  const timestamp = Date.now();
  return {
    id: `template-${timestamp}`,
    name,
    description: 'Custom university template for Course, Period, and Certificate text.',
    documentType: 'Admission Certificate',
    pageSize: { width: 595, height: 841 },
    boxes: DEFAULT_STARTER_TEMPLATE.boxes.map((b) => ({ ...b })),
    defaultValues: { ...DEFAULT_STARTER_TEMPLATE.defaultValues },
    textMarkers: [],
  };
}
