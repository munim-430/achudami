import { isHanyangTemplate, HANYANG_DEFAULT_VALUES, HanyangTemplateValues } from './hanyang';
import { isKoreaTemplate, KOREA_DEFAULT_VALUES, KoreaTemplateValues } from './korea';

import { CalibrationPreset } from '../types';

export type TemplateId = string;

export interface TemplateMetadata {
  id: string;
  name: string;
  universityName: string;
  documentType: string;
  sampleInputPath?: string;
  referenceOutputPath?: string;
  description: string;
  isBuiltIn?: boolean;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  hanyang: {
    id: 'hanyang',
    name: 'Hanyang University Confirmation of Acceptance',
    universityName: 'Hanyang University',
    documentType: 'Confirmation of Acceptance (입학확인서)',
    sampleInputPath: '/reference/hanyang-input.pdf',
    referenceOutputPath: '/reference/hanyang-output.pdf',
    description:
      'Official Confirmation of Acceptance for Hanyang University Institute of International Education. Modifies Applying Course, Education Period, and English Certificate Paragraph with Times New Roman typography.',
    isBuiltIn: true,
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
    isBuiltIn: true,
  },
};

/**
 * Deterministic template detector that inspects extracted PDF text against registered markers
 * and custom saved templates.
 */
export function detectTemplate(
  text: string,
  customTemplates: CalibrationPreset[] = []
): TemplateId {
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

  // Check Custom Templates text markers
  for (const custom of customTemplates) {
    if (custom.textMarkers && custom.textMarkers.length > 0) {
      const match = custom.textMarkers.some(
        (marker) => marker.trim().length > 0 && text.toLowerCase().includes(marker.trim().toLowerCase())
      );
      if (match) {
        return custom.id;
      }
    }
  }

  return 'unsupported';
}

export * from './hanyang';
export * from './korea';
