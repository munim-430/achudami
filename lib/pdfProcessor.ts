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
import { drawWrappedText, getTimesNewRomanFontBytes } from './pdf-utils';

export interface ProcessPDFInput {
  originalPdfBytes: Uint8Array | ArrayBuffer;
  boxes: FieldBoundingBox[];
  values: Record<string, string>;
  debugMode?: boolean;
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
 * Follows the critical instruction:
 * Always prefer real Times New Roman TTF embedded from /fonts/TimesNewRoman.ttf
 * instead of naive StandardFonts.TimesRoman.
 */
async function resolveAndEmbedFont(
  pdfDoc: PDFDocument,
  fontFamily: string,
  customFontBytes?: Uint8Array | null
): Promise<PDFFont> {
  pdfDoc.registerFontkit(fontkit);

  // If user provided a custom uploaded font and requested 'custom'
  if (fontFamily === 'custom' && customFontBytes && customFontBytes.byteLength > 0) {
    try {
      return await pdfDoc.embedFont(customFontBytes, { subset: true });
    } catch (err) {
      console.warn('Failed to embed custom user font, attempting Times New Roman TTF:', err);
    }
  }

  // 1. Primary: Authentic Times New Roman TTF from /public/fonts/TimesNewRoman.ttf
  if (fontFamily === 'TimesNewRoman' || fontFamily === 'TimesRoman' || !fontFamily) {
    const ttfBytes = await getTimesNewRomanFontBytes();
    if (ttfBytes && ttfBytes.byteLength > 0) {
      try {
        return await pdfDoc.embedFont(ttfBytes, { subset: true });
      } catch (err) {
        console.warn('Failed to embed TimesNewRoman.ttf, attempting fallback:', err);
      }
    }
  }

  // 2. Fallback: NotoSerif TTF
  if (fontFamily === 'NotoSerif' || fontFamily === 'TimesRoman' || fontFamily === 'TimesNewRoman') {
    const bytes = await getBundledFontBytes('/fonts/NotoSerif-Regular.ttf');
    if (bytes) {
      try {
        return await pdfDoc.embedFont(bytes, { subset: true });
      } catch (err) {
        console.warn('Failed to embed NotoSerif font, falling back:', err);
      }
    }
  }

  // 3. Fallback: DejaVuSans TTF
  if (fontFamily === 'DejaVuSans') {
    const bytes = await getBundledFontBytes('/fonts/DejaVuSans.ttf');
    if (bytes) {
      try {
        return await pdfDoc.embedFont(bytes, { subset: true });
      } catch (err) {
        console.warn('Failed to embed DejaVuSans font, falling back:', err);
      }
    }
  }

  // 4. Standard 14 PDF fonts fallback
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
 * Executes the "White-out and Redraw" pixel-perfect pipeline on the PDF.
 * If debugMode is true, overlays red border rectangles on the original PDF
 * without altering underlying text, allowing visual verification of coordinates.
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

  // Pre-load and cache fonts needed for the target fields
  const fontMap = new Map<string, PDFFont>();

  for (const box of options.boxes) {
    const fontKey = box.fontFamily || 'TimesNewRoman';
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
    const font = fontMap.get(box.fontFamily || 'TimesNewRoman') || fontMap.values().next().value!;
    const fontSize = Math.max(6, box.fontSize || 10.5);
    const textColor = parseHexColor(box.colorHex || '#000000', rgb(0, 0, 0));

    // DEBUG MODE: Overlay red rectangle borders for calibration and visual verification
    if (options.debugMode) {
      page.drawRectangle({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 1.5,
        color: rgb(1, 0, 0),
        opacity: 0.12,
        borderOpacity: 1.0,
      });

      page.drawText(`[DEBUG: ${box.name} (${Math.round(box.x)}, ${Math.round(box.y)})]`, {
        x: box.x,
        y: box.y + box.height + 2,
        size: 7,
        font,
        color: rgb(0.85, 0.1, 0.1),
      });

      continue;
    }

    // PRODUCTION MODE: Solid White-out Box (Erasing original text with exact RGB 1,1,1)
    const pad = Math.max(0, box.whiteoutPadding ?? 0);
    page.drawRectangle({
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    if (!replacementText.trim()) {
      continue;
    }

    if (box.multiline) {
      // Use the critical drawWrappedText utility function
      const topBaseline = box.y + box.height - fontSize * 1.1;
      drawWrappedText(
        replacementText,
        box.x,
        topBaseline,
        box.width,
        fontSize,
        font,
        page,
        textColor as RGB
      );
    } else {
      // Single line text placement
      let lineFontSize = fontSize;
      let lineWidth = 0;
      try {
        lineWidth = font.widthOfTextAtSize(replacementText, lineFontSize);
      } catch {
        lineWidth = replacementText.length * lineFontSize * 0.55;
      }

      // Auto-scale slightly if text exceeds field width to avoid overlapping other columns
      if (lineWidth > box.width) {
        lineFontSize = Math.max(8.0, (box.width / lineWidth) * lineFontSize);
        try {
          lineWidth = font.widthOfTextAtSize(replacementText, lineFontSize);
        } catch {
          lineWidth = replacementText.length * lineFontSize * 0.55;
        }
      }

      let lineX = box.x;
      if (box.alignment === 'center') {
        lineX = box.x + Math.max(0, (box.width - lineWidth) / 2);
      } else if (box.alignment === 'right') {
        lineX = box.x + Math.max(0, box.width - lineWidth);
      }

      const baselineY = box.y + (box.height - lineFontSize) / 2 + 1.5;

      page.drawText(replacementText, {
        x: lineX,
        y: baselineY,
        size: lineFontSize,
        font,
        color: textColor,
      });
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
