# Hanyang University Certificate Generation Engine

Production-grade automated certificate generation engine engineered for **Hanyang University Confirmation of Acceptance (합격증)** with **100% vector fidelity and zero visual drift**.

---

## 🏛️ Two-Pass Vector Architecture

```
                                [Original Template PDF]
                                           │
                                           ▼
                            [Pass 1: Vector Redaction]
                     (Erase only target dynamic glyphs)
                     (100% vector art, seals & headers intact)
                                           │
                                           ▼
                              [Clean Base Template]
                                           │
    [Excel / CSV Data Source]              ▼
    (60 Student Records)     ───► [Pass 2: Calibrated Injection]
                                  (NanumGothic Bold/Regular TTF)
                                           │
                                           ▼
                                 [60 Individual PDFs]
                             (Bitwise-identical layout & seals)
```

1. **Pass 1 (Template Sanitization):** Uses `PyMuPDF` (`fitz`) vector redaction annotations (`page.add_redact_annot()`) to cleanly erase only dynamic text spans while preserving all vector lines, university seals, stamps, and Korean static headers.
2. **Pass 2 (Calibrated Injection):** Injects normalized student data into exact baseline origins `(x, y)` using authentic Korean TrueType typography (`NanumGothic-Bold.ttf` & `NanumGothic-Regular.ttf`) with dynamic auto-scaling for long applicant names.

---

## 📁 Project Structure

```
hanyang-certificate-engine/
├── assets/
│   ├── clean_base_template.pdf     # Vector-sanitized base template
│   ├── NanumGothic-Bold.ttf        # Authentic Korean TrueType Bold
│   ├── NanumGothic-Regular.ttf     # Authentic Korean TrueType Regular
│   └── visual_diff_result.png      # 300 DPI QA visual diff map
├── config.py                       # Coordinates, bboxes, font metrics
├── introspect_template.py          # Coordinate & span introspection tool
├── generate_base_template.py       # Base template extraction & sanitization
├── data_processor.py               # Data parser & normalization engine
├── batch_generator.py              # In-memory fast batch generator
├── verify_diff.py                  # 300 DPI automated QA validation
├── run_generator.py                # Master CLI entry point
├── dist/                           # 60 generated PDF certificates
└── requirements.txt                # Python dependencies
```

---

## 🚀 Installation & CLI Usage

### 1. Environment Setup
```bash
cd /home/munim/hanyang-certificate-engine
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Generate Batch Certificates
```bash
python run_generator.py \
  --template "/home/munim/Downloads/MINAN_261008_114403 (9).pdf" \
  --data "/home/munim/Downloads/Hanyang University 2026 Winter - Student Acceptance List.xlsx" \
  --out ./dist
```

### 3. Run Automated QA Visual Diff Test
```bash
python verify_diff.py \
  "/home/munim/Downloads/MINAN_261008_114403 (9).pdf" \
  dist/2026832423_CHAKMA_PRATIK.pdf
```

---

## 📊 Performance Benchmark
- **Throughput:** 60 certificates in **10.48 seconds** (~0.175s / document).
- **QA Verification:** Passed at **300 DPI** with zero visual drift on seals, static labels, or borders.
