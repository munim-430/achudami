import {
  PDFDocument,
  PDFFont,
  PDFPage,
  RGB,
  rgb,
  StandardFonts,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Target field configuration interface for PDF coordinate mapping.
 * Coordinate space: PDF points where (0,0) is the bottom-left corner of the page.
 */
export interface TargetFieldConfig {
  key: 'course' | 'studyPeriod' | 'certText';
  name: string;
  originalText: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  multiline?: boolean;
}

/**
 * Strict, hardcoded configuration for Korea University Letter of Acceptance template.
 * Page dimensions: 595 x 841 pt (standard A4).
 *
 * Leaves Name (x:210, y:592), DOB (x:214, y:571), and Document ID (x:87, y:773)
 * completely untouched.
 */
export const KU_TARGET_FIELDS_CONFIG: Record<
  'course' | 'studyPeriod' | 'certText',
  TargetFieldConfig
> = {
  course: {
    key: 'course',
    name: 'Course Name',
    originalText: 'Korea University Korean Language Education Program',
    pageNumber: 1,
    x: 145.0,
    y: 546.0,
    width: 360.0,
    height: 18.0,
    fontSize: 10.5,
    multiline: false,
  },
  studyPeriod: {
    key: 'studyPeriod',
    name: 'Study Period',
    originalText: 'DEC.2026 – NOV.2027',
    pageNumber: 1,
    x: 270.0,
    y: 524.0,
    width: 150.0,
    height: 18.0,
    fontSize: 10.5,
    multiline: false,
  },
  certText: {
    key: 'certText',
    name: 'English Certificate Text',
    originalText: 'This is to certify that students who complete...',
    pageNumber: 1,
    x: 88.0,
    y: 254.0,
    width: 426.0,
    height: 64.0,
    fontSize: 10.5,
    multiline: true,
  },
};

/**
 * Alternate preset targeting the 1st English paragraph if needed:
 * "This is to certify that the above-mentioned student has been accepted..."
 */
export const KU_FIRST_PARAGRAPH_CONFIG: TargetFieldConfig = {
  key: 'certText',
  name: 'English Certificate Text (1st Paragraph)',
  originalText: 'This is to certify that the above-mentioned student...',
  pageNumber: 1,
  x: 88.0,
  y: 365.0,
  width: 426.0,
  height: 55.0,
  fontSize: 10.5,
  multiline: true,
};

export interface PDFModifierFormValues {
  course: string;
  studyPeriod: string;
  certText: string;
}

export const DEFAULT_FORM_VALUES: PDFModifierFormValues = {
  course:
    'Korea University Korean Language Education Bachelor of Business Administration Program',
  studyPeriod: 'DEC.2026 – SEP.2032',
  certText:
    'This is to certify that the above-mentioned student has been accepted into the Korean Language Program of the 2026 Winter Regular Program at Korea University Korean Language Center. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01',
};

export interface ModifyPdfOptions {
  originalPdfBytes: Uint8Array | ArrayBuffer;
  values: PDFModifierFormValues;
  fieldCoordinates?: {
    course?: Partial<TargetFieldConfig>;
    studyPeriod?: Partial<TargetFieldConfig>;
    certText?: Partial<TargetFieldConfig>;
  };
  debugMode?: boolean;
  customFontBytes?: Uint8Array | null;
}

export interface ModifyPdfResult {
  pdfBytes: Uint8Array;
  blobUrl: string;
  processingTimeMs: number;
}

// In-memory cache for TTF font ArrayBuffer to ensure instant re-renders
let cachedTtfBuffer: ArrayBuffer | null = null;

/**
 * Fetches the authentic Times New Roman TTF file from /fonts/TimesNewRoman.ttf,
 * converts to Uint8Array, and caches in memory.
 */
export async function getTimesNewRomanFontBytes(): Promise<Uint8Array | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  if (cachedTtfBuffer) {
    return new Uint8Array(cachedTtfBuffer);
  }
  try {
    const res = await fetch('/fonts/TimesNewRoman.ttf');
    if (!res.ok) {
      console.warn(
        `Failed to fetch /fonts/TimesNewRoman.ttf: ${res.status} ${res.statusText}. Checking fallback fonts.`
      );
      // Attempt fallback to NotoSerif-Regular.ttf if available
      const fallbackRes = await fetch('/fonts/NotoSerif-Regular.ttf');
      if (fallbackRes.ok) {
        cachedTtfBuffer = await fallbackRes.arrayBuffer();
        return new Uint8Array(cachedTtfBuffer);
      }
      return null;
    }
    cachedTtfBuffer = await res.arrayBuffer();
    return new Uint8Array(cachedTtfBuffer);
  } catch (err) {
    console.warn('Network error while loading TimesNewRoman.ttf:', err);
    return null;
  }
}

/**
 * CRITICAL UTILITY FUNCTION: drawWrappedText
 *
 * Multiline word-wrapping utility for pdf-lib. Splits text by spaces,
 * measures word width using font.widthOfTextAtSize, and drops to the next line
 * (decrementing Y by fontSize * 1.2) when the width exceeds maxWidth.
 *
 * @param text The input string to render
 * @param x Starting X coordinate in PDF points
 * @param y Starting Y coordinate (top baseline) in PDF points
 * @param maxWidth Maximum width allowed per line in PDF points
 * @param fontSize Font size in points
 * @param font Embedded PDFFont instance
 * @param page The target PDFPage
 * @param color Text color (defaults to black RGB 0,0,0)
 * @returns Array of wrapped lines and the final Y baseline
 */
export function drawWrappedText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: PDFFont,
  page: PDFPage,
  color: RGB = rgb(0, 0, 0)
): { lines: string[]; finalY: number } {
  // Support explicit newline carriage returns if provided by user
  const paragraphs = text.split(/\r?\n/);
  let currentY = y;
  const drawnLines: string[] = [];

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    if (!paragraph.trim()) {
      currentY -= fontSize * 1.2;
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      let candidateWidth = 0;
      try {
        candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        candidateWidth = candidate.length * fontSize * 0.55;
      }

      if (candidateWidth <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        // Draw the accumulated line on the page
        page.drawText(currentLine, {
          x,
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        drawnLines.push(currentLine);
        // Drop to the next line by decrementing Y by fontSize * 1.2
        currentY -= fontSize * 1.2;
        currentLine = word;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x,
        y: currentY,
        size: fontSize,
        font,
        color,
      });
      drawnLines.push(currentLine);
      currentY -= fontSize * 1.2;
    }
  }

  return { lines: drawnLines, finalY: currentY };
}

/**
 * Modifies the Korea University Letter of Acceptance PDF using the
 * strict Whiteout and Redraw technique with hardcoded coordinates.
 */
export async function modifyKoreaUniversityPdf(
  options: ModifyPdfOptions
): Promise<ModifyPdfResult> {
  const startTime = performance.now();

  if (!options.originalPdfBytes) {
    throw new Error('No PDF file bytes provided for processing.');
  }

  // Step 1: Load original PDF document
  const pdfDoc = await PDFDocument.load(options.originalPdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('The PDF document contains no pages.');
  }
  const page = pages[0];

  // Step 2: Register fontkit and embed authentic Times New Roman TTF
  pdfDoc.registerFontkit(fontkit);

  let embeddedFont: PDFFont;
  try {
    let fontBytes: Uint8Array | null = null;
    if (options.customFontBytes && options.customFontBytes.byteLength > 0) {
      fontBytes = options.customFontBytes;
    } else {
      fontBytes = await getTimesNewRomanFontBytes();
    }

    if (fontBytes && fontBytes.byteLength > 0) {
      embeddedFont = await pdfDoc.embedFont(fontBytes, { subset: true });
    } else {
      console.warn(
        'TimesNewRoman.ttf not found at /fonts/TimesNewRoman.ttf. Using standard serif fallback.'
      );
      embeddedFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }
  } catch (fontErr) {
    console.warn('Failed to embed custom TTF, falling back:', fontErr);
    embeddedFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  }

  // Step 3: Resolve field coordinates (defaults merged with any user overrides)
  const courseConfig: TargetFieldConfig = {
    ...KU_TARGET_FIELDS_CONFIG.course,
    ...(options.fieldCoordinates?.course || {}),
  };

  const studyPeriodConfig: TargetFieldConfig = {
    ...KU_TARGET_FIELDS_CONFIG.studyPeriod,
    ...(options.fieldCoordinates?.studyPeriod || {}),
  };

  const certTextConfig: TargetFieldConfig = {
    ...KU_TARGET_FIELDS_CONFIG.certText,
    ...(options.fieldCoordinates?.certText || {}),
  };

  const fields = [courseConfig, studyPeriodConfig, certTextConfig];

  // STEP 4: DEBUG MODE vs PRODUCTION WHITEOUT & REDRAW
  if (options.debugMode) {
    // In Debug Mode:
    // Draw crisp red borders around the target boxes on the original PDF
    // so the user can visually verify the exact bounding boxes before generation.
    for (const field of fields) {
      // Draw red border outline with subtle translucent red fill
      page.drawRectangle({
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 1.5,
        color: rgb(1, 0, 0),
        opacity: 0.12,
        borderOpacity: 1.0,
      });

      // Small label above the debug box
      page.drawText(`[DEBUG: ${field.name} (${Math.round(field.x)}, ${Math.round(field.y)})]`, {
        x: field.x,
        y: field.y + field.height + 2,
        size: 7,
        font: embeddedFont,
        color: rgb(0.85, 0.1, 0.1),
      });
    }
  } else {
    // In Production Mode:
    // 1. Draw solid RGB white (1, 1, 1) rectangles over the target fields
    // 2. Redraw new values using Times New Roman typography

    // --- FIELD 1: Course Name ---
    page.drawRectangle({
      x: courseConfig.x,
      y: courseConfig.y,
      width: courseConfig.width,
      height: courseConfig.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    const newCourseText = options.values.course || '';
    if (newCourseText.trim()) {
      // Determine font size: fit comfortably on the line if string is extra long
      let courseFontSize = courseConfig.fontSize || 10.5;
      const textWidth = embeddedFont.widthOfTextAtSize(newCourseText, courseFontSize);
      if (textWidth > courseConfig.width) {
        // Auto-scale slightly to fit within course field width
        courseFontSize = Math.max(8.0, (courseConfig.width / textWidth) * courseFontSize);
      }

      // Exact baseline: original text baseline in template is at ~550.8 - 551.2
      const courseBaseline = courseConfig.y + (courseConfig.height - courseFontSize) / 2 + 1.5;

      page.drawText(newCourseText, {
        x: courseConfig.x + 2,
        y: courseBaseline,
        size: courseFontSize,
        font: embeddedFont,
        color: rgb(0, 0, 0),
      });
    }

    // --- FIELD 2: Study Period ---
    page.drawRectangle({
      x: studyPeriodConfig.x,
      y: studyPeriodConfig.y,
      width: studyPeriodConfig.width,
      height: studyPeriodConfig.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    const newStudyPeriodText = options.values.studyPeriod || '';
    if (newStudyPeriodText.trim()) {
      const periodFontSize = studyPeriodConfig.fontSize || 10.5;
      // Exact baseline: original text baseline in template is at ~529.5 - 530.4
      const periodBaseline =
        studyPeriodConfig.y + (studyPeriodConfig.height - periodFontSize) / 2 + 1.5;

      page.drawText(newStudyPeriodText, {
        x: studyPeriodConfig.x + 2,
        y: periodBaseline,
        size: periodFontSize,
        font: embeddedFont,
        color: rgb(0, 0, 0),
      });
    }

    // --- FIELD 3: English Certificate Text (2nd Paragraph) ---
    // Multi-line word-wrapped replacement
    page.drawRectangle({
      x: certTextConfig.x,
      y: certTextConfig.y,
      width: certTextConfig.width,
      height: certTextConfig.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    const newCertText = options.values.certText || '';
    if (newCertText.trim()) {
      const certFontSize = certTextConfig.fontSize || 10.5;
      // Top line baseline starts near top of the bounding box
      const topBaseline = certTextConfig.y + certTextConfig.height - certFontSize * 1.1;

      drawWrappedText(
        newCertText,
        certTextConfig.x,
        topBaseline,
        certTextConfig.width,
        certFontSize,
        embeddedFont,
        page,
        rgb(0, 0, 0)
      );
    }
  }

  // Step 5: Save modified PDF
  const modifiedPdfBytes = await pdfDoc.save();
  const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    pdfBytes: modifiedPdfBytes,
    blobUrl,
    processingTimeMs,
  };
}

/**
 * Triggers a client-side browser file download of the PDF blob.
 */
export function triggerPdfDownload(
  pdfBytes: Uint8Array,
  filename: string = 'output.pdf'
): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
