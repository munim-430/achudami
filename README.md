# Achudami — Multi-Template High-Precision PDF Modifier

> **Target Repository**: [munim-430/achudami](https://github.com/munim-430/achudami)  
> **Environment**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, pdf-lib, @pdf-lib/fontkit, pdfjs-dist  
> **Deployment Target**: Vercel (100% Client-Side Processing • No Backend • No Database • Zero Server Overhead)

Achudami is an elite client-side web application engineered to modify specific text fields in highly structured university acceptance documents with pixel-perfect typographic fidelity using authentic **Times New Roman TrueType typography**.

It supports:
1. **Interactive 3-Field Template Editor**: Visual drag-and-resize bounding box calibration directly on any uploaded PDF for:
   - **Course Name** (`course` / `지원과정 Applying Course`)
   - **Study Period** (`studyPeriod` / `교육기간 Education Period`)
   - **Certificate Text** (`certText` / `English Certificate Paragraph`)
   With numeric coordinate nudging (+/- 1pt, +/- 5pt), typography settings, LocalStorage persistence, and JSON Export/Import.
2. **Hanyang University** — Confirmation of Acceptance (*입학확인서*)
3. **Korea University** — Letter of Acceptance (*합격통지서*)
4. **Custom University Templates** — Create, calibrate, save, and auto-detect templates for any university admission document!

---

## 🏛️ Supported Templates & Architecture

The system uses a clean, decoupled modular architecture. The Hanyang University module contains **no** Korea-specific logic, and the Korea University module contains **no** Hanyang-specific logic. Both templates share the core client-side PDF inspection and rendering primitives.

```
/
├── lib/
│   ├── templates/
│   │   ├── index.ts          # Deterministic template registry & detector
│   │   ├── hanyang.ts        # Isolated Hanyang University template handler
│   │   └── korea.ts          # Isolated Korea University template handler
│   ├── pdf/
│   │   ├── analyzer.ts       # pdfjs-dist layout, baseline, coordinate & metric extraction
│   │   ├── replacer.ts       # Solid whiteout & Times New Roman redraw engine
│   │   ├── validation.ts     # Pre-download verification (11 deterministic checks)
│   │   └── fontLoader.ts     # Strict Times New Roman TTF loader (no substitute fonts)
│   ├── pdf-utils.ts          # Wrapped text renderer & Korea Univ coordinates
│   └── presets.ts            # Korea University layout presets
├── components/
│   ├── TemplatePicker.tsx    # Universal template detector, switcher & sample loader
│   ├── HanyangForm.tsx       # Dedicated Hanyang form (Applying Course, Period, Cert)
│   ├── KoreaForm.tsx         # Dedicated Korea University form (with Debug Mode toggle)
│   ├── ComparisonViewer.tsx  # Side-by-side original vs generated document viewer
│   ├── UploadZone.tsx        # Drag-and-drop client-side PDF loader
│   └── ui/                   # shadcn-style dark mode components
├── reference/                # Golden reference document pairs
│   ├── hanyang-input.pdf     # Reference input with original spacing artifacts
│   ├── hanyang-output.pdf    # Golden reference output layout
│   └── korea-output.pdf      # Golden reference output for Korea University
├── public/
│   ├── fonts/
│   │   └── TimesNewRoman.ttf # Authentic Times New Roman TrueType font
│   ├── reference/            # Publicly served reference documents
│   └── pdf.worker.min.js     # PDF.js client-side rendering worker
└── README.md
```

---

## 🔍 Deterministic Template Detection

When a document is uploaded, `analyzePdfDocument` parses the PDF text stream using `pdfjs-dist`. `detectTemplate` matches the text against strict text markers without guessing:

- **Hanyang University Markers**:
  - `한양대학교 국제교육원`
  - `Hanyang University Institute of International Education`
  - `Confirmation of Acceptance`
  - `Studnet ID No.`
  - `지원과정`
  - `교육기간`
- **Korea University Markers**:
  - `고려대학교`
  - `Korea University`
  - `Letter of Acceptance`
  - `합격통지서`
  - `KU KLC`

If the document matches Hanyang, it routes to `HanyangForm`. If it matches Korea University, it routes to `KoreaForm`. If neither matches, it presents a clean **Unsupported Template** notification with 1-click sample loaders.

---

## 🎓 Hanyang University Template Specification

### Editable Fields

| Field | Document Label | Original Input Value | Expected Default Output | Behavior & Layout Rules |
|---|---|---|---|---|
| **1. Applying Course** | `지원과정 Applying Course` | `Korean Language Course` | `Korean Language Course`<br>`Bachelor of Business Administration` | **Multiline support**. Original label untouched at `x: 120, y: 555`. First line placed at original baseline (`555.0 pt`). Second line drawn at `y: 541.0 pt` with exact 14 pt line spacing. |
| **2. Education Period** | `교육기간 Education Period` | `2026.12.02.-2027.02.12` | `2026.12.02.-2032.09.01` | **Single-line format** `YYYY.MM.DD.-YYYY.MM.DD`. Original label untouched at `x: 120, y: 530`. Value replaces date range at original baseline (`530.0 pt`). |
| **3. English Certificate Text** | Paragraph below Korean cert | Contains broken spacing artifacts:<br>• `Certif y`<br>• `a pp licant`<br>• `Korean Lan g ua g e`<br>• `Han y an g Universit y` | `This is to Certify that the applicant named above has been admitted to the Korean Language Course of Hanyang University Institute of International Education for 2026 Winter semester. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01` | **Full paragraph replacement**. Cleans all broken input spacing. Word-wrapped via `TimesNewRoman.ttf` metrics (`maxWidth: 382.0 pt`, `fontSize: 10.5 pt`, `lineHeight: 13.5 pt`). Exact 5-line break matching HANYANG output.pdf. |

### 🔒 Locked Hanyang Fields (Zero Modifications)

The engine strictly guarantees that the following fields remain 100% untouched and preserved:
- Document title header (`한양대학교 국제교육원 / Hanyang University Institute of International Education`)
- `Confirmation of Acceptance`
- `수험번호 / Studnet ID No. :` (including the original typo `"Studnet ID No."`)
- Student ID value (`2026-HYU-0881`)
- `성명 / Applicant's Name :` & Applicant Name value (`MUNIM MOHAMMAD`)
- `생년월일 / Date of Birth :` & Date of Birth value (`2004.05.15`)
- Korean certification paragraph (`위 사람은 한양대학교 국제교육원 한국어과정 교육생으로 합격하였음을 확인합니다.`)
- Document issuance date line (`2026. 10. 06`)
- Signatory line (`한양대학교 국제교육원장 / Dean of Institute of International Education, Hanyang University`)
- Background layout, stamps, official seals, and original page geometry (595 × 841 pt)

---

## 🔤 Non-Negotiable Font Engineering Rules

1. **Authentic TrueType Typography**: All replaced Latin-script text strictly uses authentic **Times New Roman TrueType font** (`/public/fonts/TimesNewRoman.ttf`).
2. **No Substitute Fonts**: `StandardFonts.TimesRoman` or system fallbacks are explicitly prohibited.
3. **Missing Font Guard**: If `TimesNewRoman.ttf` is absent from `/public/fonts/`, generation is completely blocked, and the **Times New Roman Font Missing** warning screen is displayed.
4. **Fontkit Embedding Pipeline**:
   ```ts
   pdfDoc.registerFontkit(fontkit);
   const font = await pdfDoc.embedFont(fontBytes, { subset: true });
   ```
5. **Zero Manual Controls for Hanyang**: Automatic font size, automatic line height, and automatic word spacing matching. No manual font, spacing, coordinate, or calibration controls are exposed for Hanyang.

---

## 🛡️ Pre-Download Verification (11 Deterministic Checks)

Before permitting download of `HANYANG output.pdf`, `validateHanyangPdf` in `lib/pdf/validation.ts` executes 11 automated verification checks against the generated document structure:

1. **Times New Roman Font Embedded**: Confirms authentic TTF was loaded and embedded.
2. **Student ID Unchanged**: Verifies `Studnet ID No.` and ID value match original input.
3. **Applicant Name Unchanged**: Verifies `Applicant's Name` and name value match original input.
4. **Date of Birth Unchanged**: Verifies `Date of Birth` matches original input.
5. **Korean Paragraph Unchanged**: Verifies official Korean certification text is untouched.
6. **Date Line Unchanged**: Verifies document issuance date (`2026. 10. 06`) is untouched.
7. **Signatory Line Unchanged**: Verifies Dean of Institute signatory line is untouched.
8. **Applying Course Updated**: Confirms all lines of user course text exist in output.
9. **Education Period Updated**: Confirms new date range exists in output.
10. **English Certificate Paragraph Updated**: Confirms clean, unbroken text exists in output.
11. **Protected Layout Alignment Unshifted**: Confirms coordinates of protected fields did not shift.

If any check fails, the download is blocked and the specific failure is highlighted in the UI.

---

## 🇰🇷 Korea University Template Specification

The Korea University Letter of Acceptance module (`/lib/templates/korea.ts`) operates independently:
- **Course Name**: Covers `"Korea University Korean Language Education Program"` (`x: 145, y: 546`)
- **Study Period**: Covers `"DEC.2026 – NOV.2027"` (`x: 270, y: 524`)
- **English Certificate Text**: Covers 2nd English paragraph (`x: 88, y: 254`)
- **Debug Mode Switch**: Toggles visual red bounding box overlays on the original PDF to calibrate coordinates.

---

## 📁 Reference Document Locations

| Document | Location | Purpose |
|---|---|---|
| **Hanyang Input Reference** | `/reference/hanyang-input.pdf`<br>`/public/reference/hanyang-input.pdf` | Input sample with broken spacing artifacts |
| **Hanyang Output Golden Reference** | `/reference/hanyang-output.pdf`<br>`/public/reference/hanyang-output.pdf` | Golden reference layout matching expected output |
| **Korea Univ Output Reference** | `/reference/korea-output.pdf`<br>`/public/reference/korea-output.pdf` | Golden reference for Korea University |
| **Korea Univ Input Sample** | `/public/samples/sample-input.pdf` | Sample input for Korea University |

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or 10+

### 2. Install Dependencies
```bash
git clone https://github.com/munim-430/achudami.git
cd achudami
npm install
```

### 3. Verify Font File
Ensure `TimesNewRoman.ttf` is present in `/public/fonts/`:
```bash
ls -lh public/fonts/TimesNewRoman.ttf
```
*(An authentic TrueType Times New Roman font file is pre-bundled in `/public/fonts/TimesNewRoman.ttf`.)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build Verification
```bash
npm run build
```
This builds the Next.js App Router application with zero linting or TypeScript errors.

---

## ☁️ Vercel Deployment Guide

Achudami requires **no backend**, **no database**, and **no serverless function invocation**. It is fully deployable to Vercel in seconds:

### Option A: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the `munim-430/achudami` repository.
3. Keep the default settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Click **Deploy**.

---

## 🔄 Repository Push Steps for `munim-430/achudami`

To push all changes to the GitHub repository:

```bash
# 1. Check status
git status

# 2. Stage all modifications and new template modules
git add .

# 3. Commit changes
git commit -m "feat: add Hanyang University template module with Times New Roman engine and pre-download verification"

# 4. Push to main branch
git push origin main
```

---

## 📜 License & Compliance

MIT License. Engineered for educational and administrative document processing. All processing occurs 100% client-side in the user's browser with zero data retention.
