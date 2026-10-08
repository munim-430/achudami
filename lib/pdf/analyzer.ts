import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is registered on client-side
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface PageLayoutAnalysis {
  numPages: number;
  pageWidth: number;
  pageHeight: number;
  rawText: string;
  items: ExtractedTextItem[];
}

export interface HanyangFieldLocations {
  // Field 1: Applying Course
  courseLabelItem?: ExtractedTextItem;
  courseValueItem?: ExtractedTextItem;
  courseWhiteoutRect: { x: number; y: number; width: number; height: number };
  courseBaselineY: number;
  courseFontSize: number;

  // Field 2: Education Period
  periodLabelItem?: ExtractedTextItem;
  periodValueItem?: ExtractedTextItem;
  periodWhiteoutRect: { x: number; y: number; width: number; height: number };
  periodBaselineY: number;
  periodFontSize: number;

  // Field 3: English Certificate Paragraph
  certParagraphItems: ExtractedTextItem[];
  certWhiteoutRect: { x: number; y: number; width: number; height: number };
  certStartBaselineY: number;
  certFontSize: number;
  certLineHeight: number;
  certParagraphWidth: number;

  // Protected fields for validation
  studentIdItem?: ExtractedTextItem;
  studentIdValue?: string;
  applicantNameItem?: ExtractedTextItem;
  applicantNameValue?: string;
  dobItem?: ExtractedTextItem;
  dobValue?: string;
  koreanCertItem?: ExtractedTextItem;
  koreanCertValue?: string;
  dateItem?: ExtractedTextItem;
  dateValue?: string;
  signatoryItem?: ExtractedTextItem;
  signatoryValue?: string;
}

/**
 * Extracts all text items with exact coordinates and metrics from a PDF byte array.
 */
export async function analyzePdfDocument(
  pdfBytes: Uint8Array | ArrayBuffer
): Promise<PageLayoutAnalysis> {
  const data = new Uint8Array(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const textContent = await page.getTextContent();

  const items: ExtractedTextItem[] = [];
  const fullStrings: string[] = [];

  for (const item of textContent.items) {
    if ('str' in item && typeof item.str === 'string') {
      const str = item.str;
      const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
      const x = tx[4];
      const y = tx[5];
      const fontSize = Math.abs(tx[0]) || Math.abs(tx[3]) || item.height || 10;
      const width = item.width || str.length * fontSize * 0.5;
      const height = item.height || fontSize;

      items.push({
        str,
        x,
        y,
        width,
        height,
        fontSize,
        fontName: item.fontName || '',
      });

      if (str.trim()) {
        fullStrings.push(str);
      }
    }
  }

  return {
    numPages,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    rawText: fullStrings.join(' '),
    items,
  };
}

/**
 * Analyzes a Hanyang University PDF and automatically detects coordinates,
 * baselines, font sizes, line heights, and protected regions.
 */
export function extractHanyangFieldLocations(
  analysis: PageLayoutAnalysis
): HanyangFieldLocations {
  const { items } = analysis;

  // 1. Identify labels and values
  let courseLabelItem: ExtractedTextItem | undefined;
  let courseValueItem: ExtractedTextItem | undefined;

  let periodLabelItem: ExtractedTextItem | undefined;
  let periodValueItem: ExtractedTextItem | undefined;

  let studentIdItem: ExtractedTextItem | undefined;
  let studentIdValue = '';

  let applicantNameItem: ExtractedTextItem | undefined;
  let applicantNameValue = '';

  let dobItem: ExtractedTextItem | undefined;
  let dobValue = '';

  let koreanCertItem: ExtractedTextItem | undefined;
  let koreanCertValue = '';

  let dateItem: ExtractedTextItem | undefined;
  let dateValue = '';

  let signatoryItem: ExtractedTextItem | undefined;
  let signatoryValue = '';

  const certParagraphItems: ExtractedTextItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = item.str.trim();

    // Student ID
    if (text.includes('수험번호') || text.includes('Studnet ID')) {
      studentIdItem = item;
      // Look ahead for value
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const next = items[j];
        if (Math.abs(next.y - item.y) < 5 && next.x > item.x) {
          studentIdValue = next.str.trim();
          break;
        }
      }
    }

    // Applicant's Name
    if (text.includes('성명') || text.includes("Applicant's Name") || text.includes('Applicant')) {
      applicantNameItem = item;
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const next = items[j];
        if (Math.abs(next.y - item.y) < 5 && next.x > item.x) {
          applicantNameValue = next.str.trim();
          break;
        }
      }
    }

    // Date of Birth
    if (text.includes('생년월일') || text.includes('Date of Birth')) {
      dobItem = item;
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const next = items[j];
        if (Math.abs(next.y - item.y) < 5 && next.x > item.x) {
          dobValue = next.str.trim();
          break;
        }
      }
    }

    // Applying Course label & value
    if (text.includes('지원과정') || text.includes('Applying Course')) {
      courseLabelItem = item;
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const next = items[j];
        if (Math.abs(next.y - item.y) < 6 && next.x > item.x) {
          courseValueItem = next;
          break;
        }
      }
    }

    // Education Period label & value
    if (text.includes('교육기간') || text.includes('Education Period')) {
      periodLabelItem = item;
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const next = items[j];
        if (
          Math.abs(next.y - item.y) < 6 &&
          next.x > item.x &&
          /\d{4}\.\d{2}/.test(next.str)
        ) {
          periodValueItem = next;
          break;
        }
      }
    }

    // Korean Certification Paragraph
    if (
      text.includes('확인합니다') ||
      text.includes('교육생으로 합격하였음을') ||
      (item.y >= 450 && item.y <= 470 && text.length > 5)
    ) {
      koreanCertItem = item;
      koreanCertValue = text;
    }

    // Date item
    if (/\d{4}\.\s*\d{2}\.\s*\d{2}/.test(text) || /\d{4}년/.test(text)) {
      if (item.y < 350) {
        dateItem = item;
        dateValue = text;
      }
    }

    // Signatory item
    if (text.includes('국제교육원장') || text.includes('Dean of Institute')) {
      signatoryItem = item;
      signatoryValue = text;
    }

    // English Certificate items
    // Spans between Korean paragraph and the date line
    if (
      (text.includes('Certif') ||
        text.includes('applicant') ||
        text.includes('admitted') ||
        text.includes('Winter semester') ||
        text.includes('Korean Lan') ||
        text.includes('Han y an g') ||
        text.includes('Hanyang') ||
        text.includes('prerequisite') ||
        text.includes('Bachelor of Business')) &&
      item.y < 460 &&
      item.y > 280
    ) {
      certParagraphItems.push(item);
    }
  }

  // --- AUTOMATIC METRIC & WHITEOUT RECTANGLE CALCULATIONS ---

  // 1. Course calculations:
  // Expected value X is around 275 pt. Baseline is around 555 pt.
  const courseBaselineY = courseValueItem?.y ?? (courseLabelItem ? courseLabelItem.y : 555.0);
  const courseFontSize = courseValueItem?.fontSize ?? 11.0;
  const courseX = courseValueItem?.x ?? 275.0;
  // Whiteout rect covers old "Korean Language Course" and enough vertical space for multiline
  const courseWhiteoutRect = {
    x: Math.max(120, courseX - 2),
    y: Math.max(0, courseBaselineY - 17),
    width: 265.0,
    height: 27.0,
  };

  // 2. Period calculations:
  const periodBaselineY = periodValueItem?.y ?? (periodLabelItem ? periodLabelItem.y : 530.0);
  const periodFontSize = periodValueItem?.fontSize ?? 11.0;
  const periodX = periodValueItem?.x ?? 275.0;
  const periodWhiteoutRect = {
    x: Math.max(120, periodX - 2),
    y: Math.max(0, periodBaselineY - 6),
    width: 210.0,
    height: 14.0,
  };

  // 3. English Certificate paragraph calculations:
  let certStartBaselineY = 420.0;
  let certFontSize = 10.5;
  let certLineHeight = 13.5;
  let certParagraphWidth = 382.0; // Calibrated to match Hanyang output reference layout

  if (certParagraphItems.length > 0) {
    const ys = certParagraphItems.map((p) => p.y);
    const xs = certParagraphItems.map((p) => p.x);
    certStartBaselineY = Math.max(...ys);
    const minY = Math.min(...ys);
    const minX = Math.min(...xs);
    certFontSize = certParagraphItems[0].fontSize || 10.5;

    // Detect line height if more than 1 item
    if (ys.length > 1) {
      const sortedDistinctYs = Array.from(new Set(ys)).sort((a, b) => b - a);
      if (sortedDistinctYs.length > 1) {
        const diff = sortedDistinctYs[0] - sortedDistinctYs[1];
        if (diff > 8 && diff < 25) {
          certLineHeight = diff;
        }
      }
    }
  }

  // Cover from below the Korean paragraph down to above the date line
  const certWhiteoutRect = {
    x: 76.0,
    y: 350.0,
    width: 445.0,
    height: 85.0,
  };

  return {
    courseLabelItem,
    courseValueItem,
    courseWhiteoutRect,
    courseBaselineY,
    courseFontSize,

    periodLabelItem,
    periodValueItem,
    periodWhiteoutRect,
    periodBaselineY,
    periodFontSize,

    certParagraphItems,
    certWhiteoutRect,
    certStartBaselineY,
    certFontSize,
    certLineHeight,
    certParagraphWidth,

    studentIdItem,
    studentIdValue,
    applicantNameItem,
    applicantNameValue,
    dobItem,
    dobValue,
    koreanCertItem,
    koreanCertValue,
    dateItem,
    dateValue,
    signatoryItem,
    signatoryValue,
  };
}
