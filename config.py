"""
Configuration and coordinate metrics for Hanyang University Confirmation of Acceptance.
All coordinates were introspected from the official vector template at 100% typographic fidelity.
"""
from pathlib import Path
import pymupdf as fitz

# Paths
BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
CLEAN_TEMPLATE_PATH = ASSETS_DIR / "clean_base_template.pdf"

FONT_BOLD_PATH = ASSETS_DIR / "NanumGothic-Bold.ttf"
FONT_REGULAR_PATH = ASSETS_DIR / "NanumGothic-Regular.ttf"

# Target Redaction Bounding Boxes (Points, 1 pt = 1/72 inch, origin top-left in fitz)
REDACTION_RECTS = {
    "student_id": fitz.Rect(330.0, 212.0, 560.0, 230.0),
    "applicant_name": fitz.Rect(330.0, 252.0, 560.0, 271.0),
    "dob": fitz.Rect(325.0, 293.0, 560.0, 312.0),
    "applying_course": fitz.Rect(330.0, 328.0, 560.0, 368.0),
    "education_period": fitz.Rect(330.0, 375.0, 560.0, 394.0),
    "korean_semester_year": fitz.Rect(203.0, 432.0, 233.0, 447.0),
    "english_semester_year": fitz.Rect(82.0, 541.0, 112.0, 556.0),
    "degree_start_year": fitz.Rect(392.0, 594.0, 421.0, 610.0),
    "issue_date": fitz.Rect(255.0, 642.0, 345.0, 661.0),
}

# Injection Target Coordinates & Metrics
# Text points indicate exact baseline origin (x, y)
INJECTION_TARGETS = {
    "student_id": {
        "point": fitz.Point(336.75, 224.55),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "color": (0, 0, 0),
    },
    "applicant_name": {
        "point": fitz.Point(337.23, 265.56),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "max_width": 220.0,  # Auto-scales font if name exceeds this width
        "color": (0, 0, 0),
    },
    "dob": {
        "point": fitz.Point(330.76, 306.44),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "color": (0, 0, 0),
    },
    "course_line1": {
        "point": fitz.Point(333.96, 340.91),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "color": (0, 0, 0),
    },
    "course_line2": {
        "point": fitz.Point(333.96, 362.60),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "color": (0, 0, 0),
    },
    "education_period": {
        "point": fitz.Point(333.66, 388.33),
        "font_key": "F_Bold",
        "font_path": FONT_BOLD_PATH,
        "size": 12.95,
        "color": (0, 0, 0),
    },
    "korean_semester_year": {
        "point": fitz.Point(205.37, 443.54),
        "font_key": "F_Regular",
        "font_path": FONT_REGULAR_PATH,
        "size": 11.99,
        "color": (0, 0, 0),
    },
    "english_semester_year": {
        "point": fitz.Point(83.59, 552.26),
        "font_key": "F_Regular",
        "font_path": FONT_REGULAR_PATH,
        "size": 11.99,
        "color": (0, 0, 0),
    },
    "degree_start_year": {
        "point": fitz.Point(393.47, 606.62),
        "font_key": "F_Regular",
        "font_path": FONT_REGULAR_PATH,
        "size": 11.99,
        "color": (0, 0, 0),
    },
    "issue_date": {
        "point": fitz.Point(260.36, 656.21),
        "font_key": "F_Regular",
        "font_path": FONT_REGULAR_PATH,
        "size": 14.99,
        "color": (0, 0, 0),
    },
}
