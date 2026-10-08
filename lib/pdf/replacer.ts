import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import { embedTimesNewRoman } from './fontLoader';
import { HanyangFieldLocations } from './analyzer';

export interface HanyangReplacementValues {
  applyingCourse: string;
  educationPeriod: string;
  englishCertText: string;
}

export interface ReplaceHanyangPdfResult {
  pdfBytes: Uint8Array;
  blobUrl: string;
  processingTimeMs: number;
}

/**
 * Wraps text into lines using Times New Roman font metrics.
 */
function wrapParagraph(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PDFFont
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);

    if (width <= maxWidth || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Core PDF replacement engine for Hanyang University Confirmation of Acceptance.
 * Strictly executes white-out and redraw with Times New Roman typography.
 */
export async function replaceHanyangPdf(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  values: HanyangReplacementValues,
  locations: HanyangFieldLocations
): Promise<ReplaceHanyangPdfResult> {
  const startTime = performance.now();

  const pdfDoc = await PDFDocument.load(originalPdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('PDF has no pages.');
  }
  const page = pages[0];

  // Embed authentic Times New Roman font (throws MissingFontError if unavailable)
  const font = await embedTimesNewRoman(pdfDoc);

  // --- WHITE-OUT STEP (Solid RGB white rgb(1,1,1)) ---
  // Whiteout rule: Cover ONLY old editable values. Labels, names, DOB, ID are untouched.

  // 1. Whiteout Applying Course value
  page.drawRectangle({
    x: locations.courseWhiteoutRect.x,
    y: locations.courseWhiteoutRect.y,
    width: locations.courseWhiteoutRect.width,
    height: locations.courseWhiteoutRect.height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  // 2. Whiteout Education Period value
  page.drawRectangle({
    x: locations.periodWhiteoutRect.x,
    y: locations.periodWhiteoutRect.y,
    width: locations.periodWhiteoutRect.width,
    height: locations.periodWhiteoutRect.height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  // 3. Whiteout English Certificate Paragraph
  page.drawRectangle({
    x: locations.certWhiteoutRect.x,
    y: locations.certWhiteoutRect.y,
    width: locations.certWhiteoutRect.width,
    height: locations.certWhiteoutRect.height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  // --- REDRAW STEP (Times New Roman typography) ---

  // FIELD 1 — APPLYING COURSE (Supports Multiline)
  const courseLines = values.applyingCourse
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courseX = locations.courseValueItem?.x ?? 275.0;
  const courseBaseY = locations.courseBaselineY ?? 555.0;
  const courseFontSize = locations.courseFontSize ?? 11.0;
  const courseLineSpacing = 14.0;

  for (let i = 0; i < courseLines.length; i++) {
    const line = courseLines[i];
    const lineY = courseBaseY - i * courseLineSpacing;
    page.drawText(line, {
      x: courseX,
      y: lineY,
      size: courseFontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // FIELD 2 — EDUCATION PERIOD (Exact single-line format: YYYY.MM.DD.-YYYY.MM.DD)
  const periodValue = values.educationPeriod.trim();
  const periodX = locations.periodValueItem?.x ?? 275.0;
  // Preserve original baseline aligned with the label "교육기간 Education Period :"
  const periodBaseY = locations.periodBaselineY ?? 530.0;
  const periodFontSize = locations.periodFontSize ?? 11.0;

  page.drawText(periodValue, {
    x: periodX,
    y: periodBaseY,
    size: periodFontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // FIELD 3 — ENGLISH CERTIFICATE TEXT (Clean Multiline Word-Wrapped Paragraph)
  const certText = values.englishCertText.trim();
  const certX = 80.0;
  const certStartY = locations.certStartBaselineY ?? 420.0;
  const certFontSize = locations.certFontSize ?? 10.5;
  const certLineHeight = locations.certLineHeight ?? 13.5;
  const certMaxWidth = locations.certParagraphWidth ?? 435.0;

  // Split into paragraphs if explicit newlines, then wrap each
  const certParagraphs = certText.split(/\r?\n/);
  let currentY = certStartY;

  for (const para of certParagraphs) {
    if (!para.trim()) {
      currentY -= certLineHeight;
      continue;
    }

    const wrappedLines = wrapParagraph(para, certMaxWidth, certFontSize, font);
    for (const line of wrappedLines) {
      page.drawText(line, {
        x: certX,
        y: currentY,
        size: certFontSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= certLineHeight;
    }
  }

  const modifiedBytes = await pdfDoc.save();
  const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    pdfBytes: modifiedBytes,
    blobUrl,
    processingTimeMs,
  };
}
