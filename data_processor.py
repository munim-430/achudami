"""
Step 3: Data Parser & Formatter Script.
Loads Excel or CSV student records and normalizes dates, names, courses, and IDs.
"""
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

def format_date_of_birth(val: Any) -> str:
    """
    Normalizes DOB to match official Hanyang typography:
    ' 2006. 2. 8 (yyyy-mm-dd)' (leading space, dots with trailing spaces, no zero-padding on M/D).
    """
    dt = pd.to_datetime(val)
    return f" {dt.year}. {dt.month}. {dt.day} (yyyy-mm-dd)"

def format_education_period(start_val: Any, end_val: Any) -> str:
    """
    Normalizes Education Period to format: 'YYYY.MM.DD-.YYYY.MM.DD'
    e.g. '2026.12.02-.2027.02.12'
    """
    s_dt = pd.to_datetime(start_val)
    e_dt = pd.to_datetime(end_val)
    return f"{s_dt.strftime('%Y.%m.%d')}-.{e_dt.strftime('%Y.%m.%d')}"

def format_issue_date(val: Any) -> str:
    """
    Normalizes Issue Date to format: 'YYYY-MM-DD'
    e.g. '2026-10-06'
    """
    dt = pd.to_datetime(val)
    return dt.strftime("%Y-%m-%d")

def sanitize_name(val: Any) -> str:
    """
    Ensures name is uppercase and cleaned of redundant whitespace.
    """
    if not val:
        return ""
    return " ".join(str(val).strip().split()).upper()

def sanitize_student_id(val: Any) -> str:
    """
    Formats Student ID No. cleanly as a string.
    """
    if pd.isna(val):
        return ""
    if isinstance(val, (int, float)):
        return str(int(val))
    return str(val).strip()

def load_and_normalize_records(data_path: str) -> List[Dict[str, Any]]:
    path = Path(data_path)
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {data_path}")

    if path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(str(path))
    elif path.suffix.lower() == ".csv":
        df = pd.read_csv(str(path))
    else:
        raise ValueError(f"Unsupported data format: {path.suffix}. Must be .xlsx or .csv")

    records = []
    for idx, row in df.iterrows():
        student_id = sanitize_student_id(row.get("Student ID No."))
        applicant_name = sanitize_name(row.get("Applicant Name"))
        dob_formatted = format_date_of_birth(row.get("Date of Birth"))

        # Course name
        course_name = str(row.get("Applying Course", "Korean Language Course")).strip()

        # Education dates
        start_date = row.get("Education Start Date")
        end_date = row.get("Education End Date")
        edu_period = format_education_period(start_date, end_date)

        # Issue date
        issue_date = format_issue_date(row.get("Issue Date", "2026-10-06"))

        # Semester info
        semester_str = str(row.get("Semester", "2026 Winter")).strip()
        # Parse year from semester (e.g. '2026' from '2026 Winter')
        sem_year = semester_str.split()[0] if semester_str else "2026"
        # Degree program starts in the autumn following education end date
        end_dt = pd.to_datetime(end_date)
        degree_start_year = str(end_dt.year) if not pd.isna(end_dt) else "2027"

        # Sl No.
        sl_no = row.get("Sl No.", idx + 1)

        record = {
            "sl_no": sl_no,
            "student_id": student_id,
            "applicant_name": applicant_name,
            "dob_formatted": dob_formatted,
            "applying_course": course_name,
            "degree_program": "Bachelor of Business Administration",
            "education_period": edu_period,
            "korean_semester_year": sem_year,
            "english_semester_year": sem_year,
            "degree_start_year": degree_start_year,
            "issue_date": issue_date,
            "institution": str(row.get("Institution", "Hanyang University Institute of International Education")).strip(),
            # Output file name: {Student_ID}_{Applicant_Name}.pdf
            "filename": f"{student_id}_{applicant_name.replace(' ', '_')}.pdf",
        }
        records.append(record)

    return records

if __name__ == "__main__":
    sample_data = "/home/munim/Downloads/Hanyang University 2026 Winter - Student Acceptance List.xlsx"
    data = load_and_normalize_records(sample_data)
    print(f"Loaded {len(data)} normalized student records.\n")
    print("Sample Record 1:")
    for k, v in data[0].items():
        print(f"  {k}: {repr(v)}")
