# Hanyang Acceptance Letter Engine & Web Portal

**Author:** Saemur Rahman

Production-grade automated certificate generation engine engineered for **Hanyang University Confirmation of Acceptance (합격증)** with **100% vector fidelity, zero visual drift, and client-side web deployment**.

Deployable instantly to **Vercel** with **zero server costs**, zero compute timeouts, and 100% client-side privacy.

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

1. **Pass 1 (Template Sanitization):** Uses vector redaction to cleanly erase only dynamic text spans while preserving all vector lines, university seals, stamps, and Korean static headers.
2. **Pass 2 (Calibrated Injection):** Injects normalized student data into exact baseline origins `(x, y)` using authentic Korean TrueType typography (`NanumGothic-Bold.ttf` & `NanumGothic-Regular.ttf`) with dynamic auto-scaling for long applicant names.

---

## 🌐 Next.js Web Portal (Vercel Deployable)

The web portal runs entirely in the user's browser using `pdf-lib` + `@pdf-lib/fontkit` + `xlsx` + `jszip`:
- **Upload Any Student Excel / CSV:** Parses student IDs, DOBs, course details, education periods, and issue dates automatically.
- **Upload Custom Template or Use Built-in Hanyang Template:** Pre-bundled with the verified clean Hanyang template.
- **Interactive Data Table:** Search, filter, and view all 60 students.
- **Single-Click PDF Preview & Download:** High-resolution vector modal preview before printing.
- **Batch 1-Click ZIP Download:** Generates all 60 certificates client-side in seconds and zips them into a single archive.

### Deploy to Vercel (Manual or Git)
1. Fork or push this repository to GitHub.
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import the repository.
4. Leave framework preset as **Next.js** (root directory: `/`).
5. Click **"Deploy"**. The site will build statically and deploy globally across Vercel Edge CDN with zero configuration needed.

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

To build production:
```bash
npm run build
npm run start
```

---

## 🐍 Python CLI Engine (Alternative / Offline Batch)

The repository also includes the Python automation scripts:

### Environment Setup
```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### Batch Generation via CLI
```bash
python run_generator.py \
  --template "public/samples/Hanyang-Template-Sample.pdf" \
  --data "public/samples/Hanyang-Student-Acceptance-List-Sample.xlsx" \
  --out ./dist
```

### 300 DPI QA Visual Diff Verification
```bash
python verify_diff.py \
  "public/samples/Hanyang-Template-Sample.pdf" \
  dist/2026832423_CHAKMA_PRATIK.pdf
```

---

## 📁 Repository Structure

```
hanyang-certificate-engine/
├── app/
│   ├── layout.tsx                  # Next.js root layout
│   ├── page.tsx                    # Main portal dashboard
│   └── globals.css                 # Tailwind CSS styling
├── components/
│   ├── Header.tsx                  # Navigation header
│   ├── FileUploadZone.tsx          # Excel & PDF drag-and-drop uploaders
│   ├── StudentTable.tsx            # Searchable records table with preview/download
│   └── PreviewModal.tsx            # High-res vector certificate preview
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── excelParser.ts              # SheetJS date and string normalizer
│   └── pdfGenerator.ts             # In-browser pdf-lib + fontkit vector engine
├── public/
│   ├── assets/
│   │   └── clean_base_template.pdf # Pre-bundled sanitized template
│   ├── fonts/
│   │   ├── NanumGothic-Bold.ttf    # Korean Bold font
│   │   ├── NanumGothic-Regular.ttf # Korean Regular font
│   │   └── TimesNewRoman.ttf       # Roman font
│   └── samples/
│       ├── Hanyang-Student-Acceptance-List-Sample.xlsx # 60 student sample
│       └── Hanyang-Template-Sample.pdf                # Reference PDF
├── config.py                       # Python coordinate configurations
├── run_generator.py                # Python master CLI runner
└── requirements.txt                # Python dependencies
```

---

## 📊 Benchmarks
- **Client-Side Generation:** 60 certificates in ~12 seconds in Chrome/Edge/Firefox.
- **Zero Server Costs:** 100% of compute occurs on the client device.
- **Pixel-Level Accuracy:** Passed automated diff testing at 300 DPI against the official Hanyang Acceptance Letter.
