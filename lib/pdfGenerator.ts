import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
import { StudentRecord, UniversityId, UNIVERSITIES } from "./types";

let cachedNanumBold: ArrayBuffer | null = null;
let cachedNanumRegular: ArrayBuffer | null = null;
let cachedTimesRegular: ArrayBuffer | null = null;
let cachedTimesBold: ArrayBuffer | null = null;

const cachedTemplates: Record<string, ArrayBuffer> = {};

export async function getBundledFonts(): Promise<{
  nanumBold: ArrayBuffer;
  nanumRegular: ArrayBuffer;
  timesRegular: ArrayBuffer;
  timesBold: ArrayBuffer;
}> {
  if (!cachedNanumBold) {
    const res = await fetch("/fonts/NanumGothic-Bold.ttf");
    cachedNanumBold = await res.arrayBuffer();
  }
  if (!cachedNanumRegular) {
    const res = await fetch("/fonts/NanumGothic-Regular.ttf");
    cachedNanumRegular = await res.arrayBuffer();
  }
  if (!cachedTimesRegular) {
    const res = await fetch("/fonts/TimesNewRoman.ttf");
    cachedTimesRegular = await res.arrayBuffer();
  }
  if (!cachedTimesBold) {
    const res = await fetch("/fonts/TimesNewRoman-Bold.ttf");
    cachedTimesBold = await res.arrayBuffer();
  }

  return {
    nanumBold: cachedNanumBold,
    nanumRegular: cachedNanumRegular,
    timesRegular: cachedTimesRegular,
    timesBold: cachedTimesBold,
  };
}

export async function getTemplateBytes(university: UniversityId): Promise<ArrayBuffer> {
  const path = UNIVERSITIES[university].defaultTemplatePath;
  if (!cachedTemplates[path]) {
    const res = await fetch(path);
    cachedTemplates[path] = await res.arrayBuffer();
  }
  return cachedTemplates[path];
}

// Backward compatibility alias
export async function getDefaultTemplateBytes(): Promise<ArrayBuffer> {
  return getTemplateBytes("hanyang");
}

/**
 * Redacts target dynamic fields if user uploads a raw, unredacted template PDF.
 */
export function applyVectorRedaction(page: any, university: UniversityId = "hanyang") {
  const h = page.getHeight();
  const white = rgb(1, 1, 1);

  if (university === "hanyang") {
    const rects = [
      { x: 325.0, y0: 212.0, y1: 230.0, w: 235.0 }, // student ID
      { x: 325.0, y0: 252.0, y1: 271.0, w: 235.0 }, // name
      { x: 325.0, y0: 293.0, y1: 312.0, w: 235.0 }, // dob
      { x: 325.0, y0: 328.0, y1: 368.0, w: 235.0 }, // course & degree
      { x: 325.0, y0: 375.0, y1: 394.0, w: 235.0 }, // period
      { x: 255.0, y0: 642.0, y1: 661.0, w: 95.0 },  // issue date
    ];
    for (const r of rects) {
      page.drawRectangle({
        x: r.x,
        y: h - r.y1,
        width: r.w,
        height: r.y1 - r.y0,
        color: white,
        borderWidth: 0,
      });
    }
  } else if (university === "korea") {
    const rects = [
      { x: 80.0, y0: 58.0, y1: 72.0, w: 125.0 },   // ref no
      { x: 80.0, y0: 235.0, y1: 252.0, w: 435.0 }, // Name line
      { x: 80.0, y0: 256.0, y1: 273.0, w: 435.0 }, // DOB line
      { x: 80.0, y0: 277.0, y1: 294.0, w: 435.0 }, // Course line
      { x: 80.0, y0: 298.0, y1: 315.0, w: 435.0 }, // Study Period line
      { x: 80.0, y0: 385.0, y1: 419.0, w: 435.0 }, // Korean body
      { x: 80.0, y0: 420.0, y1: 473.0, w: 435.0 }, // English body
      { x: 200.0, y0: 644.0, y1: 661.0, w: 200.0 }, // Date
    ];
    for (const r of rects) {
      page.drawRectangle({
        x: r.x,
        y: h - r.y1,
        width: r.w,
        height: r.y1 - r.y0,
        color: white,
        borderWidth: 0,
      });
    }
  } else if (university === "skku") {
    const rects = [
      { x: 258.0, y0: 246.0, y1: 263.0, w: 260.0 }, // ID
      { x: 258.0, y0: 265.0, y1: 282.0, w: 260.0 }, // Name
      { x: 258.0, y0: 284.0, y1: 301.0, w: 260.0 }, // DOB
      { x: 258.0, y0: 304.0, y1: 320.0, w: 260.0 }, // Nationality
      { x: 258.0, y0: 323.0, y1: 339.0, w: 260.0 }, // Program 1
      { x: 258.0, y0: 342.0, y1: 359.0, w: 260.0 }, // Program 2
      { x: 258.0, y0: 362.0, y1: 379.0, w: 260.0 }, // Admission Date
      { x: 258.0, y0: 382.0, y1: 400.0, w: 260.0 }, // Study Period
      { x: 138.0, y0: 560.0, y1: 638.0, w: 304.0 }, // Body text
      { x: 250.0, y0: 651.0, y1: 673.0, w: 100.0 }, // Bottom Date
    ];
    for (const r of rects) {
      page.drawRectangle({
        x: r.x,
        y: h - r.y1,
        width: r.w,
        height: r.y1 - r.y0,
        color: white,
        borderWidth: 0,
      });
    }
  }
}

/**
 * 1. Generates Hanyang University Certificate
 */
async function generateHanyangCertificate(
  record: StudentRecord,
  pdfDoc: PDFDocument,
  fonts: { boldFont: any; regularFont: any },
  isRawTemplate: boolean
) {
  const page = pdfDoc.getPages()[0];
  const h = page.getHeight();
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  if (isRawTemplate) {
    applyVectorRedaction(page, "hanyang");
  }

  const maxWidth = 220.0;
  const drawAutoScaledBold = (text: string, x: number, y: number, baseSize: number = 12.95) => {
    if (!text) return;
    let size = baseSize;
    try {
      const textWidth = fonts.boldFont.widthOfTextAtSize(text, size);
      if (textWidth > maxWidth) {
        size = Math.round((size * (maxWidth / textWidth) * 0.98) * 100) / 100;
      }
    } catch {
      // Fallback
    }
    page.drawText(text, {
      x,
      y: h - y,
      size,
      font: fonts.boldFont,
      color: black,
    });
  };

  // 1. Student ID No.
  drawAutoScaledBold(record.studentId, 336.75, 224.55);

  // 2. Applicant Name
  drawAutoScaledBold(record.applicantName, 337.23, 265.56);

  // 3. Date of Birth
  drawAutoScaledBold(record.dobFormatted, 330.76, 306.44);

  // 4. Applying Course Line 1
  drawAutoScaledBold(record.applyingCourse, 333.96, 340.91);

  // 4b. Applying Course Line 2 (Degree)
  drawAutoScaledBold(record.degreeProgram, 333.96, 362.6);

  // 5. Education Period
  drawAutoScaledBold(record.educationPeriod, 333.66, 388.33);

  // Dynamic Semester & Degree Date (Checks if customized)
  const isCustomSemester =
    record.englishSemesterYear &&
    record.englishSemesterYear.trim() !== "" &&
    record.englishSemesterYear.trim() !== "2025 Winter";

  if (isCustomSemester) {
    // Redact static Korean semester text at (205, 433)
    page.drawRectangle({
      x: 202.0,
      y: h - 446.0,
      width: 32.0,
      height: 14.0,
      color: white,
      borderWidth: 0,
    });
    page.drawText(record.koreanSemesterYear, {
      x: 203.0,
      y: h - 444.0,
      size: 11.99,
      font: fonts.regularFont,
      color: black,
    });

    // Redact static English semester text at (83, 542)
    page.drawRectangle({
      x: 82.0,
      y: h - 556.0,
      width: 72.0,
      height: 14.0,
      color: white,
      borderWidth: 0,
    });
    page.drawText(record.englishSemesterYear, {
      x: 82.0,
      y: h - 554.0,
      size: 11.99,
      font: fonts.regularFont,
      color: black,
    });
  }

  const isCustomDegreeDate =
    record.degreeStartYear &&
    record.degreeStartYear.trim() !== "" &&
    record.degreeStartYear.trim() !== "2026-09-01";

  if (isCustomDegreeDate) {
    // Redact static degree date at (393, 595)
    page.drawRectangle({
      x: 391.0,
      y: h - 610.0,
      width: 68.0,
      height: 15.0,
      color: white,
      borderWidth: 0,
    });
    page.drawText(record.degreeStartYear, {
      x: 392.0,
      y: h - 607.0,
      size: 11.99,
      font: fonts.regularFont,
      color: black,
    });
  }

  // 6. Issue Date (Bottom)
  if (record.issueDate) {
    page.drawText(record.issueDate, {
      x: 260.36,
      y: h - 656.21,
      size: 14.99,
      font: fonts.regularFont,
      color: black,
    });
  }
}

/**
 * 2. Generates Korea University (고려대학교) Certificate
 */
async function generateKoreaUnivCertificate(
  record: StudentRecord,
  pdfDoc: PDFDocument,
  fonts: { nanumBold: any; nanumRegular: any },
  isRawTemplate: boolean
) {
  const page = pdfDoc.getPages()[0];
  const w = page.getWidth();
  const h = page.getHeight();
  const black = rgb(0, 0, 0);

  if (isRawTemplate) {
    applyVectorRedaction(page, "korea");
  }

  // Top Left Reference Number: [87.79, 60.38] -> 'KU KLC-2026-10-06-001'
  const refText = record.referenceNo || `KU KLC-${record.issueDate}-001`;
  page.drawText(refText, {
    x: 87.79,
    y: h - 69.37,
    size: 8.99,
    font: fonts.nanumRegular,
    color: black,
  });

  // Centered helper
  const drawCentered = (text: string, yPosFromTop: number, size: number, font: any) => {
    if (!text) return;
    try {
      const textWidth = font.widthOfTextAtSize(text, size);
      const x = Math.max(50, (w - textWidth) / 2);
      page.drawText(text, {
        x,
        y: h - yPosFromTop,
        size,
        font,
        color: black,
      });
    } catch {
      // Fallback
    }
  };

  // 4 Centered Metadata lines
  // 1. Name: TAMIM REAZUL HOQUE KHONDOKAR
  drawCentered(`Name: ${record.applicantName}`, 250.45, 12.95, fonts.nanumRegular);

  // 2. Date of Birth: 01-07-2003
  drawCentered(`Date of Birth: ${record.dobFormatted}`, 271.31, 12.95, fonts.nanumRegular);

  // 3. Course: Korea University Korean Language Education Program
  drawCentered(`Course: ${record.applyingCourse}`, 292.04, 12.95, fonts.nanumRegular);

  // 4. Study Period: DEC.2026 – NOV.2027
  drawCentered(`Study Period: ${record.educationPeriod}`, 312.78, 12.95, fonts.nanumRegular);

  // Dynamic Korean Body Line
  const semYear = record.koreanSemesterYear || "2026";
  const koreanBodyLine1 = `위 학생은 고려대학교 한국어센터 ${semYear}학년도 정규과정 겨울학기 한국어과정에`;
  drawCentered(koreanBodyLine1, 400.32, 11.03, fonts.nanumRegular);
  drawCentered("합격하였음을 알려드립니다.", 417.82, 11.03, fonts.nanumRegular);

  // Dynamic English Body Line
  drawCentered(
    "This is to certify that the above-mentioned student has been accepted into",
    435.44,
    11.03,
    fonts.nanumRegular
  );
  const engSemester = record.englishSemesterYear || "2026 Winter Regular Program";
  drawCentered(
    `the Korean Language Program of the ${engSemester} at`,
    453.06,
    11.03,
    fonts.nanumRegular
  );
  drawCentered(
    "Korea University Korean Language Center.",
    470.56,
    11.03,
    fonts.nanumRegular
  );

  // Bottom Issue Date: [228.6, 646.36] -> '2026년   10월   06일'
  const dateObj = new Date(record.issueDate);
  const issueYear = !isNaN(dateObj.getFullYear()) ? dateObj.getFullYear() : 2026;
  const issueMonth = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, "0") : "10";
  const issueDay = !isNaN(dateObj.getDate()) ? String(dateObj.getDate()).padStart(2, "0") : "06";
  const dateKorean = `${issueYear}년   ${issueMonth}월   ${issueDay}일`;
  drawCentered(dateKorean, 659.31, 12.95, fonts.nanumRegular);
}

/**
 * 3. Generates Sungkyunkwan University (SKKU - 성균관대학교) Certificate
 */
async function generateSKKUCertificate(
  record: StudentRecord,
  pdfDoc: PDFDocument,
  fonts: { timesRegular: any; timesBold: any },
  isRawTemplate: boolean
) {
  const page = pdfDoc.getPages()[0];
  const h = page.getHeight();
  const black = rgb(0, 0, 0);

  if (isRawTemplate) {
    applyVectorRedaction(page, "skku");
  }

  // Left-aligned dynamic values at x = 262.4
  const startX = 262.4;

  // 1. Student ID No.: [262.4, 248.5]
  page.drawText(record.studentId, {
    x: startX,
    y: h - 261.2,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 2. Name: [262.4, 267.3]
  page.drawText(record.applicantName, {
    x: startX,
    y: h - 280.1,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 3. Date of Birth: [262.4, 286.1] -> YYYY-MM-DD
  page.drawText(record.dobFormatted, {
    x: startX,
    y: h - 298.9,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 4. Nationality: [262.4, 306.5] -> Bangladesh
  page.drawText(record.nationality || "Bangladesh", {
    x: startX,
    y: h - 317.0,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 5. Program Line 1: [262.3, 325.5]
  page.drawText(record.applyingCourse, {
    x: startX,
    y: h - 336.0,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 6. Program Line 2 (Degree): [264.0, 344.1]
  page.drawText(record.degreeProgram, {
    x: 264.0,
    y: h - 356.8,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 7. Admission Date: [262.3, 364.1]
  page.drawText(record.admissionDate || record.issueDate, {
    x: startX,
    y: h - 376.8,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // 8. Study Period: [262.3, 384.1]
  page.drawText(record.educationPeriod, {
    x: startX,
    y: h - 396.8,
    size: 9.48,
    font: fonts.timesRegular,
    color: black,
  });

  // Dynamic Enrollment Schedule Paragraph (Lines at y = 577, 591, 605, 619)
  const enrollYear = record.koreanSemesterYear || "2026";
  const degreeStart = record.degreeStartYear || "01 march, 2027";

  const p1 = "The above-mentioned person is scheduled to enroll in the";
  const p2 = `regular Korean language program at our institution on January 01,`;
  const p3 = `${enrollYear}.This is a prerequisite program designed to improve Korean `;
  const p4 = "language proficiency which is necessary for enrollment in the ";
  const p5 = `Bachelor's degree program which will start from ${degreeStart}.`;

  const drawCenteredPara = (text: string, yFromTop: number) => {
    try {
      const textWidth = fonts.timesRegular.widthOfTextAtSize(text, 11.04);
      const x = Math.max(50, (page.getWidth() - textWidth) / 2);
      page.drawText(text, {
        x,
        y: h - yFromTop,
        size: 11.04,
        font: fonts.timesRegular,
        color: black,
      });
    } catch {
      // Fallback
    }
  };

  drawCenteredPara(p1, 577.4);
  drawCenteredPara(p2, 591.2);
  drawCenteredPara(p3, 605.0);
  drawCenteredPara(p4, 618.8);
  drawCenteredPara(p5, 632.6);

  // Bottom Issue Date: [265.9, 653.7] -> YYYY-MM-DD
  page.drawText(record.issueDate, {
    x: 265.9,
    y: h - 669.7,
    size: 12.6,
    font: fonts.timesBold,
    color: black,
  });
}

/**
 * Universal Certificate Generator
 */
export async function generateSingleCertificate(
  record: StudentRecord,
  templateBytes: ArrayBuffer,
  boldFontBytes: ArrayBuffer,
  regularFontBytes: ArrayBuffer,
  isRawTemplate: boolean = false,
  university: UniversityId = "hanyang"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  pdfDoc.registerFontkit(fontkit);

  // Embed complete fonts without subsetting to avoid glyph outline / CMap dropout in PDF viewers
  if (university === "hanyang") {
    const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    await generateHanyangCertificate(record, pdfDoc, { boldFont, regularFont }, isRawTemplate);
  } else if (university === "korea") {
    const nanumBold = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const nanumRegular = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    await generateKoreaUnivCertificate(record, pdfDoc, { nanumBold, nanumRegular }, isRawTemplate);
  } else {
    // SKKU
    const { timesRegular: timesRegBytes, timesBold: timesBoldBytes } = await getBundledFonts();
    const timesRegular = await pdfDoc.embedFont(timesRegBytes, { subset: false });
    const timesBold = await pdfDoc.embedFont(timesBoldBytes, { subset: false });
    await generateSKKUCertificate(record, pdfDoc, { timesRegular, timesBold }, isRawTemplate);
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
  university: UniversityId = "hanyang",
  onProgress?: (current: number, total: number, name: string) => void
): Promise<{ zipBlob: Blob; certificates: { filename: string; pdfBytes: Uint8Array }[] }> {
  const { nanumBold, nanumRegular } = await getBundledFonts();
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
      nanumBold,
      nanumRegular,
      isRawTemplate,
      university
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
