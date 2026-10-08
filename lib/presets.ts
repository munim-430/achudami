import { CalibrationPreset, FieldBoundingBox, FieldValues } from './types';

export const KU_ACCEPTANCE_LETTER_PRESET: CalibrationPreset = {
  id: 'ku-acceptance-letter',
  name: 'Korea University Acceptance Letter',
  description:
    'Calibrated layout matching official KU KLC Admission certificates (Course, Period, & English text)',
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
      x: 147.28,
      y: 546.0,
      width: 358.0,
      height: 16.0,
      fontSize: 10.2,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 1.0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-study-period',
      name: 'Study Period',
      key: 'studyPeriod',
      pageNumber: 1,
      x: 273.69,
      y: 525.5,
      width: 143.0,
      height: 16.0,
      fontSize: 10.2,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: false,
      whiteoutPadding: 1.0,
      whiteoutColorHex: '#FFFFFF',
    },
    {
      id: 'field-cert-text',
      name: 'English Certificate Text',
      key: 'certText',
      pageNumber: 1,
      x: 88.0,
      y: 356.0,
      width: 426.0,
      height: 60.0,
      fontSize: 9.2,
      lineHeight: 12.5,
      fontFamily: 'TimesRoman',
      alignment: 'left',
      colorHex: '#000000',
      multiline: true,
      whiteoutPadding: 1.0,
      whiteoutColorHex: '#FFFFFF',
    },
  ],
  defaultValues: {
    course: 'Korea University Korean Language Education',
    studyPeriod: 'DEC.2026 – SEP.2032',
    certText:
      'This is to certify that the above-mentioned student has been accepted into the Korean Language Program of the 2026 Winter Regular Program at Korea University Korean Language Center. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01',
  },
};

export const DEFAULT_INITIAL_BOXES: FieldBoundingBox[] =
  KU_ACCEPTANCE_LETTER_PRESET.boxes;

export const DEFAULT_INITIAL_VALUES: FieldValues =
  KU_ACCEPTANCE_LETTER_PRESET.defaultValues;

export const ALL_PRESETS: CalibrationPreset[] = [KU_ACCEPTANCE_LETTER_PRESET];
