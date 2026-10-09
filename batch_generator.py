"""
Step 4: Batch PDF Generation Engine.
Injects normalized student records into the sanitized vector template at 100% typographic fidelity.
"""
from pathlib import Path
from typing import List, Dict, Any
import pymupdf as fitz
from config import (
    CLEAN_TEMPLATE_PATH,
    INJECTION_TARGETS,
    FONT_BOLD_PATH,
    FONT_REGULAR_PATH,
)

class CertificateGenerator:
    def __init__(self, base_template_path: str = None):
        self.base_template_path = Path(base_template_path or CLEAN_TEMPLATE_PATH)
        if not self.base_template_path.exists():
            raise FileNotFoundError(
                f"Base template not found at {self.base_template_path}. "
                "Run generate_base_template.py first."
            )
        # Read template bytes into memory for fast cloning
        with open(self.base_template_path, "rb") as f:
            self._template_bytes = f.read()

        # Pre-verify font paths
        if not FONT_BOLD_PATH.exists() or not FONT_REGULAR_PATH.exists():
            raise FileNotFoundError("TrueType font assets missing in assets/ directory.")

    def generate_single_certificate(self, record: Dict[str, Any], output_path: Path) -> Path:
        """
        Injects a single student's data into the vector template.
        """
        doc = fitz.open(stream=self._template_bytes, filetype="pdf")
        page = doc[0]

        # Register authentic Korean TrueType fonts
        page.insert_font(fontname="F_Bold", fontfile=str(FONT_BOLD_PATH))
        page.insert_font(fontname="F_Regular", fontfile=str(FONT_REGULAR_PATH))

        # 1. Student ID No.
        t_id = INJECTION_TARGETS["student_id"]
        page.insert_text(
            t_id["point"],
            record["student_id"],
            fontname=t_id["font_key"],
            fontsize=t_id["size"],
            color=t_id["color"],
        )

        # 2. Applicant Name (with dynamic auto-scaling guard)
        t_name = INJECTION_TARGETS["applicant_name"]
        font_obj = fitz.Font(fontfile=str(FONT_BOLD_PATH))
        name_str = record["applicant_name"]
        name_size = t_name["size"]
        max_width = t_name["max_width"]
        text_len = font_obj.text_length(name_str, fontsize=name_size)
        if text_len > max_width:
            # Scale down to fit comfortably
            name_size = round(name_size * (max_width / text_len) * 0.98, 2)

        page.insert_text(
            t_name["point"],
            name_str,
            fontname=t_name["font_key"],
            fontsize=name_size,
            color=t_name["color"],
        )

        # 3. Date of Birth
        t_dob = INJECTION_TARGETS["dob"]
        page.insert_text(
            t_dob["point"],
            record["dob_formatted"],
            fontname=t_dob["font_key"],
            fontsize=t_dob["size"],
            color=t_dob["color"],
        )

        # 4. Applying Course (Line 1: Course, Line 2: Degree conditional clause)
        t_c1 = INJECTION_TARGETS["course_line1"]
        page.insert_text(
            t_c1["point"],
            record["applying_course"],
            fontname=t_c1["font_key"],
            fontsize=t_c1["size"],
            color=t_c1["color"],
        )

        t_c2 = INJECTION_TARGETS["course_line2"]
        page.insert_text(
            t_c2["point"],
            record["degree_program"],
            fontname=t_c2["font_key"],
            fontsize=t_c2["size"],
            color=t_c2["color"],
        )

        # 5. Education Period
        t_edu = INJECTION_TARGETS["education_period"]
        page.insert_text(
            t_edu["point"],
            record["education_period"],
            fontname=t_edu["font_key"],
            fontsize=t_edu["size"],
            color=t_edu["color"],
        )

        # 6. Korean Semester Year
        t_ksem = INJECTION_TARGETS["korean_semester_year"]
        page.insert_text(
            t_ksem["point"],
            record["korean_semester_year"],
            fontname=t_ksem["font_key"],
            fontsize=t_ksem["size"],
            color=t_ksem["color"],
        )

        # 7. English Semester Year
        t_esem = INJECTION_TARGETS["english_semester_year"]
        page.insert_text(
            t_esem["point"],
            record["english_semester_year"],
            fontname=t_esem["font_key"],
            fontsize=t_esem["size"],
            color=t_esem["color"],
        )

        # 8. Degree Program Start Year
        t_dyear = INJECTION_TARGETS["degree_start_year"]
        page.insert_text(
            t_dyear["point"],
            record["degree_start_year"],
            fontname=t_dyear["font_key"],
            fontsize=t_dyear["size"],
            color=t_dyear["color"],
        )

        # 9. Issue Date
        t_issue = INJECTION_TARGETS["issue_date"]
        page.insert_text(
            t_issue["point"],
            record["issue_date"],
            fontname=t_issue["font_key"],
            fontsize=t_issue["size"],
            color=t_issue["color"],
        )

        # Save with clean compaction
        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path), garbage=4, deflate=True)
        doc.close()
        return output_path

    def batch_generate(
        self, records: List[Dict[str, Any]], output_dir: str
    ) -> List[Path]:
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        generated_files = []
        total = len(records)
        print(f"\n[START BATCH] Generating {total} certificate documents into: {out_dir}\n")

        for idx, rec in enumerate(records, 1):
            out_file = out_dir / rec["filename"]
            print(f"[{idx}/{total}] Generating: {rec['filename']}...", end="", flush=True)
            self.generate_single_certificate(rec, out_file)
            print(" done.")
            generated_files.append(out_file)

        print(f"\n[COMPLETE] Successfully generated {len(generated_files)} publication-ready PDFs.\n")
        return generated_files

if __name__ == "__main__":
    from data_processor import load_and_normalize_records
    sample_data = "/home/munim/Downloads/Hanyang University 2026 Winter - Student Acceptance List.xlsx"
    records = load_and_normalize_records(sample_data)
    engine = CertificateGenerator()
    engine.batch_generate(records[:3], "output_test")
