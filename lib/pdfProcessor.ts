import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  RGB,
  Color,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { FieldBoundingBox, ProcessPDFResult } from './types';

export interface ProcessPDFInput {
  originalPdfBytes: Uint8Array | ArrayBuffer;
  boxes: FieldBoundingBox[];
  values: Record<string, string>;
  customFontBytes?: Uint8Array | null;
  customFontName?: string;
}

// In-memory cache for bundled TTF fonts to avoid re-fetching on every edit
const fontBytesCache = new Map<string, ArrayBuffer>();

async function getBundledFontBytes(fontPath: string): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return null;
  if (fontBytesCache.has(fontPath)) {
    return fontBytesCache.get(fontPath)!;
  }
  try {
    const res = await fetch(fontPath);
    if (!res.ok) {
      console.warn(`Could not load bundled font from ${fontPath}: ${res.statusText}`);
      return null;
    }
    const buffer = await res.arrayBuffer();
    fontBytesCache.set(fontPath, buffer);
    return buffer;
  } catch (err) {
    console.warn(`Failed to fetch font at ${fontPath}`, err);
    return null;
  }
}

/**
 * Resolves and embeds the appropriate font into the pdf-lib document.
 */
async function resolveAndEmbedFont(
  pdfDoc: PDFDocument,
  fontFamily: string,
  customFontBytes?: Uint8Array | null
): Promise<PDFFont> {
  // If user provided a custom uploaded font and requested 'custom'
  if (fontFamily === 'custom' && customFontBytes && customFontBytes.byteLength > 0) {
    try {
      pdfDoc.registerFontkit(fontkit);
      return await pdfDoc.embedFont(customFontBytes, { subset: true });
    } catch (err) {
      console.warn('Failed to embed custom user font, falling back to Times Roman:', err);
    }
  }

  // Bundled TTF fonts
  if (fontFamily === 'NotoSerif') {
    const bytes = await getBundledFontBytes('/fonts/NotoSerif-Regular.ttf');
    if (bytes) {
      try {
        pdfDoc.registerFontkit(fontkit);
        return await pdfDoc.embedFont(bytes, { subset: true });
      } catch (err) {
        console.warn('Failed to embed NotoSerif font, falling back:', err);
      }
    }
  }

  if (fontFamily === 'DejaVuSans') {
    const bytes = await getBundledFontBytes('/fonts/DejaVuSans.ttf');
    if (bytes) {
      try {
        pdfDoc.registerFontkit(fontkit);
        return await pdfDoc.embedFont(bytes, { subset: true });
      } catch (err) {
        console.warn('Failed to embed DejaVuSans font, falling back:', err);
      }
    }
  }

  // Standard 14 PDF fonts
  switch (fontFamily) {
    case 'TimesRomanBold':
      return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    case 'TimesRoman':
      return await pdfDoc.embedFont(StandardFonts.TimesRoman);
    case 'HelveticaBold':
      return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    case 'Helvetica':
      return await pdfDoc.embedFont(StandardFonts.Helvetica);
    case 'CourierBold':
      return await pdfDoc.embedFont(StandardFonts.CourierBold);
    case 'Courier':
      return await pdfDoc.embedFont(StandardFonts.Courier);
    default:
      // Default to TimesRoman as best match for formal certificates
      return await pdfDoc.embedFont(StandardFonts.TimesRoman);
  }
}

/**
 * Parses hex color string (e.g., "#000000" or "#FFFFFF") into pdf-lib RGB color.
 */
function parseHexColor(hex: string, defaultColor: RGB = rgb(0, 0, 0)): Color {
  if (!hex || typeof hex !== 'string') return defaultColor;
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6 && clean.length !== 3) return defaultColor;

  let r = 0;
  let g = 0;
  let b = 0;

  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return defaultColor;
  return rgb(r, g, b);
}

/**
 * Wraps text into multiple lines such that each line fits within maxWidth.
 * Respects explicit newlines and handles word overflow gracefully.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      resultLines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      let candidateWidth = 0;
      try {
        candidateWidth = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        // Fallback approximate width in case of character encoding issue
        candidateWidth = candidate.length * fontSize * 0.55;
      }

      if (candidateWidth <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        resultLines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
}

/**
 * Executes the "White-out and Redraw" pixel-perfect pipeline on the PDF.
 */
export async function processPDFDocument(
  options: ProcessPDFInput
): Promise<ProcessPDFResult> {
  const startTime = performance.now();

  if (!options.originalPdfBytes) {
    throw new Error('No PDF file data provided for processing.');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(options.originalPdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse PDF document: ${msg}`);
  }

  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  // Pre-load and cache fonts needed for the bounding boxes
  const fontMap = new Map<string, PDFFont>();

  for (const box of options.boxes) {
    const fontKey = box.fontFamily || 'TimesRoman';
    if (!fontMap.has(fontKey)) {
      const font = await resolveAndEmbedFont(
        pdfDoc,
        fontKey,
        options.customFontBytes
      );
      fontMap.set(fontKey, font);
    }
  }

  // Process each target field bounding box
  for (const box of options.boxes) {
    const pageIndex = Math.max(0, Math.min(box.pageNumber - 1, pages.length - 1));
    const page = pages[pageIndex];

    const replacementText = options.values[box.key] ?? '';
    const font = fontMap.get(box.fontFamily || 'TimesRoman')!;
    const fontSize = Math.max(6, box.fontSize || 10);
    const textColor = parseHexColor(box.colorHex || '#000000', rgb(0, 0, 0));
    const whiteoutColor = parseHexColor(
      box.whiteoutColorHex || '#FFFFFF',
      rgb(1, 1, 1)
    );

    // Step 1: Solid White-out Box (Erasing original text)
    const pad = Math.max(0, box.whiteoutPadding ?? 1.5);
    page.drawRectangle({
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
      color: whiteoutColor,
      borderWidth: 0,
    });

    if (!replacementText.trim()) {
      continue;
    }

    // Step 2: Calculate Lines & Word-Wrapping
    const innerWidth = Math.max(10, box.width);
    const lines = box.multiline
      ? wrapText(replacementText, font, fontSize, innerWidth)
      : replacementText.split(/\r?\n/);

    const lineHeight =
      box.lineHeight && box.lineHeight > 0
        ? box.lineHeight
        : fontSize * 1.35;

    // Baseline calculation:
    // Top of the box in PDF coordinate space is box.y + box.height.
    // The first line baseline sits below the top of the box.
    const boxTop = box.y + box.height;
    const firstLineBaseline = boxTop - fontSize * 0.95;

    // Step 3: Draw each line with exact alignment
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (!lineText) continue;

      let lineWidth = 0;
      try {
        lineWidth = font.widthOfTextAtSize(lineText, fontSize);
      } catch {
        lineWidth = lineText.length * fontSize * 0.55;
      }

      let lineX = box.x;
      if (box.alignment === 'center') {
        lineX = box.x + Math.max(0, (box.width - lineWidth) / 2);
      } else if (box.alignment === 'right') {
        lineX = box.x + Math.max(0, box.width - lineWidth);
      }

      const lineY = firstLineBaseline - i * lineHeight;

      // Draw text safely
      try {
        page.drawText(lineText, {
          x: lineX,
          y: lineY,
          size: fontSize,
          font,
          color: textColor,
        });
      } catch (drawErr) {
        // Fallback for special unicode glyphs if standard font encounters WinAnsi encoding issues
        console.warn(`Font glyph encoding warning on line "${lineText}":`, drawErr);
        // Attempt sanitized ASCII drawing
        const sanitized = lineText.replace(/[^\x00-\x7F]/g, ' ');
        try {
          page.drawText(sanitized, {
            x: lineX,
            y: lineY,
            size: fontSize,
            font,
            color: textColor,
          });
        } catch {
          // Ignore if still failing
        }
      }
    }
  }

  // Save the modified PDF
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
