import * as XLSX from "xlsx";
import { StudentRecord, UniversityId } from "./types";

/**
 * Parses Excel dates (handles Date objects, numbers, and strings).
 */
export function parseExcelDate(val: unknown): Date {
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === "number") {
    // Excel date epoch: 1900-01-01 (accounting for Excel 1900 leap year bug)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date;
  }
  if (typeof val === "string") {
    const s = val.trim();
    // Check if format is DD-MM-YYYY
    const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      return new Date(year, month, day);
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function formatDateOfBirthHanyang(val: unknown): string {
  const d = parseExcelDate(val);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return ` ${year}. ${month}. ${day} (yyyy-mm-dd)`;
}

export function formatDateOfBirthKorea(val: unknown): string {
  const d = parseExcelDate(val);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateOfBirthSKKU(val: unknown): string {
  const d = parseExcelDate(val);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

export function parseExcelFile(
  arrayBuffer: ArrayBuffer,
  university: UniversityId = "hanyang"
): StudentRecord[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  const records: StudentRecord[] = [];

  rawRows.forEach((row, idx) => {
    const studentId = sanitizeStudentId(
      row["Student ID No."] ||
        row["Student ID"] ||
        row["StudentID"] ||
        row["ID"] ||
        row["Reference No."] ||
        `2026${String(idx + 1).padStart(6, "0")}`
    );
    const applicantName = sanitizeName(
      row["Applicant Name"] || row["Name"] || row["Applicant"] || row["Student Name"]
    );
    if (!applicantName && !row["Student ID No."]) return;

    // Dates
    const rawDob = row["Date of Birth"] || row["DOB"] || "2003-01-01";
    let dobFormatted = "";
    if (university === "hanyang") {
      dobFormatted = formatDateOfBirthHanyang(rawDob);
    } else if (university === "korea") {
      dobFormatted = formatDateOfBirthKorea(rawDob);
    } else {
      dobFormatted = formatDateOfBirthSKKU(rawDob);
    }

    const courseName = String(
      row["Applying Course"] ||
        row["Course"] ||
        (university === "korea"
          ? "Korea University Korean Language Education Program"
          : university === "skku"
          ? "Regular Korean Language Program (D-4-1)"
          : "Korean Language Course")
    ).trim();

    const startVal = row["Education Start Date"] || row["Start Date"] || "2026-12-02";
    const endVal = row["Education End Date"] || row["End Date"] || "2027-02-12";
    const eduPeriod =
      university === "korea"
        ? String(row["Study Period"] || "DEC.2026 – NOV.2027").trim()
        : university === "skku"
        ? String(row["Study Period"] || "2026-01-01 ~ 2031-02-25").trim()
        : formatEducationPeriod(startVal, endVal);

    const issueDateRaw = row["Issue Date"] || (university === "skku" ? "2025-11-20" : "2026-10-06");
    const issueDate = formatIssueDate(issueDateRaw);

    // Dynamic Semester & Degree Date (Hanyang requirement & universal)
    const semesterStr = String(row["Semester"] || (university === "hanyang" ? "2025 Winter" : "2026 Winter")).trim();
    const semYear = semesterStr.split(" ")[0] || "2025";

    const degreeStartYear = String(
      row["Degree Start Date"] ||
        row["Degree Start Year"] ||
        (university === "hanyang" ? "2026-09-01" : university === "skku" ? "01 march, 2027" : "2027-03-01")
    ).trim();

    const degreeProgram = String(
      row["Degree Program"] ||
        row["Degree"] ||
        row["Major"] ||
        "Bachelor of Business Administration"
    ).trim();

    const nationality = String(row["Nationality"] || "Bangladesh").trim();
    const admissionDate = String(row["Admission Date"] || issueDate).trim();
    const referenceNo = String(
      row["Reference No."] ||
        row["Ref No."] ||
        `KU KLC-${issueDate}-${String(idx + 1).padStart(3, "0")}`
    ).trim();

    const cleanNameForFile = (applicantName || "STUDENT").replace(/\s+/g, "_");
    const filename = `${studentId}_${cleanNameForFile}.pdf`;

    records.push({
      slNo: (row["Sl No."] as number | string) || idx + 1,
      studentId,
      applicantName: applicantName || "STUDENT NAME",
      dobFormatted,
      dobRaw: String(rawDob),
      applyingCourse: courseName,
      degreeProgram,
      educationPeriod: eduPeriod,
      koreanSemesterYear: semYear,
      englishSemesterYear: semesterStr,
      degreeStartYear,
      issueDate,
      institution:
        university === "korea"
          ? "Korea University Korean Language Center"
          : university === "skku"
          ? "Sungkyunkwan University Sungkyun Language Institute"
          : "Hanyang University Institute of International Education",
      filename,
      nationality,
      referenceNo,
      admissionDate,
      sessionTuition: String(row["Tuition Fee"] || "1,750,000").trim(),
    });
  });

  return records;
}

/**
 * Creates an Excel buffer for a sample template matching the selected university.
 */
export function generateSampleExcelBuffer(university: UniversityId): Uint8Array {
  const wb = XLSX.utils.book_new();

  let data: Record<string, any>[] = [];

  if (university === "hanyang") {
    data = [
      {
        "Sl No.": 1,
        "Student ID No.": "2025832474",
        "Applicant Name": "MD MINANUR RAHMAN",
        "Date of Birth": "2003-01-07",
        "Applying Course": "Korean Language Course",
        "Degree Program": "Bachelor of Business Administration",
        "Education Start Date": "2025-12-03",
        "Education End Date": "2026-02-13",
        Semester: "2025 Winter",
        "Degree Start Date": "2026-09-01",
        "Issue Date": "2025-10-01",
      },
      {
        "Sl No.": 2,
        "Student ID No.": "2025832475",
        "Applicant Name": "SAEMUR RAHMAN",
        "Date of Birth": "2002-05-15",
        "Applying Course": "Korean Language Course",
        "Degree Program": "Bachelor of Computer Science",
        "Education Start Date": "2025-12-03",
        "Education End Date": "2026-02-13",
        Semester: "2025 Winter",
        "Degree Start Date": "2026-09-01",
        "Issue Date": "2025-10-01",
      },
    ];
  } else if (university === "korea") {
    data = [
      {
        "Sl No.": 1,
        "Reference No.": "KU KLC-2026-10-06-001",
        "Applicant Name": "TAMIM REAZUL HOQUE KHONDOKAR",
        "Date of Birth": "01-07-2003",
        "Applying Course": "Korea University Korean Language Education Program",
        "Study Period": "DEC.2026 – NOV.2027",
        Semester: "2026 Winter",
        "Issue Date": "2026-10-06",
      },
      {
        "Sl No.": 2,
        "Reference No.": "KU KLC-2026-10-06-002",
        "Applicant Name": "SAEMUR RAHMAN",
        "Date of Birth": "15-05-2002",
        "Applying Course": "Korea University Korean Language Education Program",
        "Study Period": "DEC.2026 – NOV.2027",
        Semester: "2026 Winter",
        "Issue Date": "2026-10-06",
      },
    ];
  } else {
    // SKKU
    data = [
      {
        "Sl No.": 1,
        "Student ID No.": "2025551073",
        "Applicant Name": "KHAN MD RAFI",
        "Date of Birth": "2003-12-06",
        Nationality: "Bangladesh",
        "Applying Course": "Regular Korean Language Program (D-4-1)",
        "Degree Program": "Bachelor of Business Administration",
        "Admission Date": "2025-11-20",
        "Study Period": "2026-01-01 ~ 2031-02-25",
        "Tuition Fee": "1,750,000",
        "Degree Start Date": "01 march, 2027",
        "Issue Date": "2025-11-20",
      },
      {
        "Sl No.": 2,
        "Student ID No.": "2025551074",
        "Applicant Name": "SAEMUR RAHMAN",
        "Date of Birth": "2002-05-15",
        Nationality: "Bangladesh",
        "Applying Course": "Regular Korean Language Program (D-4-1)",
        "Degree Program": "Bachelor of Software Engineering",
        "Admission Date": "2025-11-20",
        "Study Period": "2026-01-01 ~ 2031-02-25",
        "Tuition Fee": "1,750,000",
        "Degree Start Date": "01 march, 2027",
        "Issue Date": "2025-11-20",
      },
    ];
  }

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Intake");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}
