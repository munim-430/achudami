import { PDFDocument, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export class MissingFontError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingFontError';
  }
}

// In-memory font cache for browser session
let cachedTimesNewRomanBytes: Uint8Array | null = null;

/**
 * Checks whether TimesNewRoman.ttf is available at /fonts/TimesNewRoman.ttf.
 */
export async function checkTimesNewRomanAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (cachedTimesNewRomanBytes && cachedTimesNewRomanBytes.byteLength > 0) {
    return true;
  }
  try {
    const res = await fetch('/fonts/TimesNewRoman.ttf', { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Strictly loads the authentic Times New Roman TTF font from /fonts/TimesNewRoman.ttf.
 * NON-NEGOTIABLE RULE: No substitute fonts allowed. If missing, throws MissingFontError.
 */
export async function loadTimesNewRomanFontBytes(): Promise<Uint8Array> {
  if (typeof window === 'undefined') {
    throw new MissingFontError('Font loading is only supported on client-side.');
  }

  if (cachedTimesNewRomanBytes && cachedTimesNewRomanBytes.byteLength > 0) {
    return cachedTimesNewRomanBytes;
  }

  try {
    const res = await fetch('/fonts/TimesNewRoman.ttf');
    if (!res.ok) {
      throw new MissingFontError(
        `TimesNewRoman.ttf not found at /fonts/TimesNewRoman.ttf (HTTP ${res.status}). Generation blocked. Please place TimesNewRoman.ttf in /public/fonts/.`
      );
    }
    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
      throw new MissingFontError('TimesNewRoman.ttf file is invalid or empty.');
    }
    cachedTimesNewRomanBytes = new Uint8Array(arrayBuffer);
    return cachedTimesNewRomanBytes;
  } catch (err) {
    if (err instanceof MissingFontError) throw err;
    throw new MissingFontError(
      `Failed to load TimesNewRoman.ttf: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Registers fontkit and embeds the authentic Times New Roman font into the PDFDocument.
 */
export async function embedTimesNewRoman(pdfDoc: PDFDocument): Promise<PDFFont> {
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadTimesNewRomanFontBytes();
  return await pdfDoc.embedFont(fontBytes, { subset: true });
}
