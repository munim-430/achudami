import * as XLSX from "xlsx";
import { StudentRecord } from "./types";

/**
 * Parses Excel dates (handles Date objects, numbers, and strings).
 */
function parseExcelDate(val: unknown): Date {
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === "number") {
    // Excel date epoch: 1900-01-01 (accounting for Excel 1900 leap year bug)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date;
  }
  if (typeof val === "string") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function formatDateOfBirth(val: unknown): string {
  const d = parseExcelDate(val);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return ` ${year}. ${month}. ${day} (yyyy-mm-dd)`;
}

export function formatEducationPeriod(startVal: unknown, endVal: unknown): string {
  const s = parseExcelDate(startVal);
  const e = parseExcelDate(endVal);

  const pad = (n: number) => String(n).padStart(2, "0");
  const sStr = `${s.getFullYear()}.${pad(s.getMonth() + 1)}.${pad(s.getDate())}`;
  const eStr = `${e.getFullYear()}.${pad(e.getMonth() + 1)}.${pad(e.getDate())}`;
  return `${sStr}-.${eStr}`;
}

export function formatIssueDate(val: unknown): string {
  const d = parseExcelDate(val);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sanitizeName(val: unknown): string {
  if (!val) return "";
  return String(val).trim().replace(/\s+/g, " ").toUpperCase();
}

export function sanitizeStudentId(val: unknown): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

export function parseExcelFile(arrayBuffer: ArrayBuffer): StudentRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  const records: StudentRecord[] = [];

  rawRows.forEach((row, idx) => {
    const studentId = sanitizeStudentId(row["Student ID No."] || row["StudentID"] || row["ID"]);
    const applicantName = sanitizeName(row["Applicant Name"] || row["Name"] || row["Applicant"]);
    if (!studentId && !applicantName) return;

    const dobFormatted = formatDateOfBirth(row["Date of Birth"] || row["DOB"]);
    const courseName = String(row["Applying Course"] || "Korean Language Course").trim();

    const startVal = row["Education Start Date"] || "2026-12-02";
    const endVal = row["Education End Date"] || "2027-02-12";
    const eduPeriod = formatEducationPeriod(startVal, endVal);

    const issueDate = formatIssueDate(row["Issue Date"] || "2026-10-06");
    const semesterStr = String(row["Semester"] || "2026 Winter").trim();
    const semYear = semesterStr.split(" ")[0] || "2026";

    const endDt = parseExcelDate(endVal);
    const degreeStartYear = String(endDt.getFullYear() || 2027);

    const filename = `${studentId}_${applicantName.replace(/\s+/g, "_")}.pdf`;

    records.push({
      slNo: (row["Sl No."] as number | string) || idx + 1,
      studentId,
      applicantName,
      dobFormatted,
      applyingCourse: courseName,
      degreeProgram: String(row["Degree Program"] || row["Degree"] || "Bachelor of Business Administration").trim(),
      educationPeriod: eduPeriod,
      koreanSemesterYear: semYear,
      englishSemesterYear: semYear,
      degreeStartYear,
      issueDate,
      institution: String(row["Institution"] || "Hanyang University Institute of International Education").trim(),
      filename,
    });
  });

  return records;
}
