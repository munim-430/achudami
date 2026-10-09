import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
import { StudentRecord } from "./types";

let cachedBoldFont: ArrayBuffer | null = null;
let cachedRegularFont: ArrayBuffer | null = null;
let cachedBaseTemplate: ArrayBuffer | null = null;

export async function getBundledFonts(): Promise<{
  boldFont: ArrayBuffer;
  regularFont: ArrayBuffer;
}> {
  if (!cachedBoldFont) {
    const res = await fetch("/fonts/NanumGothic-Bold.ttf");
    cachedBoldFont = await res.arrayBuffer();
  }
  if (!cachedRegularFont) {
    const res = await fetch("/fonts/NanumGothic-Regular.ttf");
    cachedRegularFont = await res.arrayBuffer();
  }
  return {
    boldFont: cachedBoldFont,
    regularFont: cachedRegularFont,
  };
}

export async function getDefaultTemplateBytes(): Promise<ArrayBuffer> {
  if (!cachedBaseTemplate) {
    const res = await fetch("/assets/clean_base_template.pdf");
    cachedBaseTemplate = await res.arrayBuffer();
  }
  return cachedBaseTemplate;
}

/**
 * Redacts target dynamic fields if user uploads a raw, unredacted template PDF.
 */
export function applyVectorRedaction(page: any) {
  const h = page.getHeight();
  const white = rgb(1, 1, 1);

  // Redaction rects: only redact dynamic student fields and bottom date
  const rects = [
    { x: 325.0, y0: 212.0, y1: 230.0, w: 235.0 }, // student ID
    { x: 325.0, y0: 252.0, y1: 271.0, w: 235.0 }, // name
    { x: 325.0, y0: 293.0, y1: 312.0, w: 235.0 }, // dob
    { x: 325.0, y0: 328.0, y1: 368.0, w: 235.0 }, // course & degree
    { x: 325.0, y0: 375.0, y1: 394.0, w: 235.0 }, // period
    { x: 255.0, y0: 642.0, y1: 661.0, w: 95.0 },  // issue date
  ];

  for (const r of rects) {
    const rectHeight = r.y1 - r.y0;
    const rectY = h - r.y1;
    page.drawRectangle({
      x: r.x,
      y: rectY,
      width: r.w,
      height: rectHeight,
      color: white,
      borderWidth: 0,
    });
  }
}

/**
 * Generates a single pixel-perfect PDF certificate matching Python PyMuPDF output.
 */
export async function generateSingleCertificate(
  record: StudentRecord,
  templateBytes: ArrayBuffer,
  boldFontBytes: ArrayBuffer,
  regularFontBytes: ArrayBuffer,
  isRawTemplate: boolean = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  pdfDoc.registerFontkit(fontkit);

  const fontBold = await pdfDoc.embedFont(boldFontBytes, { subset: true });
  const fontRegular = await pdfDoc.embedFont(regularFontBytes, { subset: true });

  const page = pdfDoc.getPages()[0];
  const h = page.getHeight();
  const black = rgb(0, 0, 0);

  if (isRawTemplate) {
    applyVectorRedaction(page);
  }

  const maxWidth = 220.0;

  // Helper for auto-scaled bold text
  const drawAutoScaledBold = (text: string, x: number, y: number, baseSize: number = 12.95) => {
    if (!text) return;
    let size = baseSize;
    try {
      const textWidth = fontBold.widthOfTextAtSize(text, size);
      if (textWidth > maxWidth) {
        size = Math.round((size * (maxWidth / textWidth) * 0.98) * 100) / 100;
      }
    } catch {
      // Fallback if measurement throws
    }
    page.drawText(text, {
      x,
      y: h - y,
      size,
      font: fontBold,
      color: black,
    });
  };

  // 1. Student ID No.
  drawAutoScaledBold(record.studentId, 336.75, 224.55);

  // 2. Applicant Name (auto-scaled)
  drawAutoScaledBold(record.applicantName, 337.23, 265.56);

  // 3. Date of Birth
  drawAutoScaledBold(record.dobFormatted, 330.76, 306.44);

  // 4. Applying Course Line 1 (auto-scaled)
  drawAutoScaledBold(record.applyingCourse, 333.96, 340.91);

  // 4b. Applying Course Line 2 (Degree conditional clause - auto-scaled)
  drawAutoScaledBold(record.degreeProgram, 333.96, 362.60);

  // 5. Education Period
  drawAutoScaledBold(record.educationPeriod, 333.66, 388.33);

  // 6. Issue Date (Bottom)
  if (record.issueDate) {
    page.drawText(record.issueDate, {
      x: 260.36,
      y: h - 656.21,
      size: 14.99,
      font: fontRegular,
      color: black,
    });
  }

  return await pdfDoc.save();
}

/**
 * Batch generates all certificates and returns a downloadable ZIP Blob.
 */
export async function generateBatchZip(
  records: StudentRecord[],
  templateBytes: ArrayBuffer,
  isRawTemplate: boolean,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<{ zipBlob: Blob; certificates: { filename: string; pdfBytes: Uint8Array }[] }> {
  const { boldFont, regularFont } = await getBundledFonts();
  const zip = new JSZip();
  const certificates: { filename: string; pdfBytes: Uint8Array }[] = [];

  const total = records.length;
  for (let i = 0; i < total; i++) {
    const rec = records[i];
    if (onProgress) {
      onProgress(i + 1, total, rec.applicantName);
    }

    const pdfBytes = await generateSingleCertificate(
      rec,
      templateBytes,
      boldFont,
      regularFont,
      isRawTemplate
    );

    zip.file(rec.filename, pdfBytes);
    certificates.push({
      filename: rec.filename,
      pdfBytes,
    });

    // Yield to browser event loop
    await new Promise((r) => setTimeout(r, 0));
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { zipBlob, certificates };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
