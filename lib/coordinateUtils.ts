import { FieldBoundingBox } from './types';

export interface CanvasBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Converts a screen/canvas pixel rectangle (origin top-left)
 * to standard PDF coordinates in points (origin bottom-left, 72 pt/inch).
 *
 * @param canvasBox Rectangle in canvas coordinate space (pixels from top-left)
 * @param scale Viewport scale factor (canvas pixels per PDF point)
 * @param pageHeight Total height of the PDF page in PDF points
 */
export function canvasToPdfCoordinates(
  canvasBox: CanvasBox,
  scale: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  const safeScale = scale > 0 ? scale : 1;
  const unscaledX = canvasBox.x / safeScale;
  const unscaledY = canvasBox.y / safeScale;
  const unscaledWidth = Math.max(1, canvasBox.width / safeScale);
  const unscaledHeight = Math.max(1, canvasBox.height / safeScale);

  // In PDF coordinate space, (0,0) is bottom-left.
  // The bottom edge of the box is at: pageHeight - (top + height)
  const pdfY = pageHeight - (unscaledY + unscaledHeight);

  return {
    x: roundToPrecision(unscaledX, 2),
    y: roundToPrecision(pdfY, 2),
    width: roundToPrecision(unscaledWidth, 2),
    height: roundToPrecision(unscaledHeight, 2),
  };
}

/**
 * Converts standard PDF coordinates (points, origin bottom-left)
 * to screen/canvas pixel coordinates (origin top-left).
 *
 * @param pdfBox Rectangle in PDF coordinates
 * @param scale Viewport scale factor (canvas pixels per PDF point)
 * @param pageHeight Total height of the PDF page in PDF points
 */
export function pdfToCanvasCoordinates(
  pdfBox: { x: number; y: number; width: number; height: number },
  scale: number,
  pageHeight: number
): CanvasBox {
  const safeScale = scale > 0 ? scale : 1;
  const canvasX = pdfBox.x * safeScale;
  // Top edge of the box in PDF is pdfBox.y + pdfBox.height
  const canvasY = (pageHeight - (pdfBox.y + pdfBox.height)) * safeScale;
  const canvasWidth = pdfBox.width * safeScale;
  const canvasHeight = pdfBox.height * safeScale;

  return {
    x: roundToPrecision(canvasX, 2),
    y: roundToPrecision(canvasY, 2),
    width: roundToPrecision(canvasWidth, 2),
    height: roundToPrecision(canvasHeight, 2),
  };
}

/**
 * Converts a mouse event client position to internal canvas pixels,
 * properly accounting for CSS display scaling vs backing canvas resolution.
 */
export function getCanvasRelativePoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

  const rawX = (clientX - rect.left) * scaleX;
  const rawY = (clientY - rect.top) * scaleY;

  return {
    x: Math.max(0, Math.min(canvas.width, rawX)),
    y: Math.max(0, Math.min(canvas.height, rawY)),
  };
}

/**
 * Clamps bounding box values so they do not exceed PDF page bounds.
 */
export function clampPdfBoundingBox(
  box: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  const x = Math.max(0, Math.min(box.x, pageWidth - 10));
  const y = Math.max(0, Math.min(box.y, pageHeight - 10));
  const width = Math.max(5, Math.min(box.width, pageWidth - x));
  const height = Math.max(5, Math.min(box.height, pageHeight - y));

  return {
    x: roundToPrecision(x, 2),
    y: roundToPrecision(y, 2),
    width: roundToPrecision(width, 2),
    height: roundToPrecision(height, 2),
  };
}

/**
 * Rounds a number to a specified decimal precision.
 */
export function roundToPrecision(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Formats a point coordinate for clean display.
 */
export function formatPoints(pt: number): string {
  return `${roundToPrecision(pt, 1)} pt`;
}
