import { isHanyangTemplate, HANYANG_DEFAULT_VALUES, HanyangTemplateValues } from './hanyang';
import { isKoreaTemplate, KOREA_DEFAULT_VALUES, KoreaTemplateValues } from './korea';

export type TemplateId = 'hanyang' | 'korea' | 'unsupported';

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  universityName: string;
  documentType: string;
  sampleInputPath: string;
  referenceOutputPath: string;
  description: string;
}

export const TEMPLATE_REGISTRY: Record<Exclude<TemplateId, 'unsupported'>, TemplateMetadata> = {
  hanyang: {
    id: 'hanyang',
    name: 'Hanyang University Confirmation of Acceptance',
    universityName: 'Hanyang University',
    documentType: 'Confirmation of Acceptance (입학확인서)',
    sampleInputPath: '/reference/hanyang-input.pdf',
    referenceOutputPath: '/reference/hanyang-output.pdf',
    description:
      'Official Confirmation of Acceptance for Hanyang University Institute of International Education. Modifies Applying Course, Education Period, and English Certificate Paragraph with Times New Roman typography.',
  },
  korea: {
    id: 'korea',
    name: 'Korea University Letter of Acceptance',
    universityName: 'Korea University',
    documentType: 'Letter of Acceptance (합격통지서)',
    sampleInputPath: '/samples/sample-input.pdf',
    referenceOutputPath: '/reference/korea-output.pdf',
    description:
      'Official Letter of Acceptance for Korea University Korean Language Center. Modifies Course Name, Study Period, and English Certificate Paragraph with Times New Roman typography.',
  },
};

/**
 * Deterministic template detector that inspects extracted PDF text against registered markers.
 * If matches Hanyang -> 'hanyang'
 * If matches Korea -> 'korea'
 * If neither -> 'unsupported' (Do not guess or force)
 */
export function detectTemplate(text: string): TemplateId {
  if (!text || typeof text !== 'string') {
    return 'unsupported';
  }

  // Check Hanyang University markers
  if (isHanyangTemplate(text)) {
    return 'hanyang';
  }

  // Check Korea University markers
  if (isKoreaTemplate(text)) {
    return 'korea';
  }

  return 'unsupported';
}

export * from './hanyang';
export * from './korea';
