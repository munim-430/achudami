# Achudami — Korea University PDF Text Modifier

> **Target Repository**: [munim-430/achudami](https://github.com/munim-430/achudami)  
> **Environment**: Next.js 14+ (App Router), TypeScript, Tailwind CSS  
> **Deployment Target**: Vercel (100% Client-Side Processing • No Backend • No Database)

Achudami is a high-precision, client-side web application that modifies targeted text fields in a highly structured PDF template (**Korea University Letter of Acceptance / 합격통지서**) with pixel-perfect fidelity, using authentic **Times New Roman typography** with exact metrics and font sizing.

---

## 🎯 The Core Problem & The Fix

Previous approaches failed because they relied on naive text-search algorithms or incorrect bounding boxes, accidentally modifying sensitive fields like **"Name"** and **"Date of Birth"** while missing the intended target fields.

### The Fix
1. **NO Naive Text Search**: The engine uses the deterministic **"Whiteout and Redraw"** technique with **strict, hardcoded PDF coordinates** (PDF points, 72 pt = 1 inch, origin bottom-left).
2. **Untouched Fields Protected**: Leaves **Name** (`PROMI MUMTAHINA`), **Date of Birth** (`12-18-2005`), and **Document ID** (`KU KLC-2026-10-06-005`), as well as seals and Korean headers, completely untouched.
3. **Only Modifies the 3 Target Fields**:
   - **Course Name**: Covers `"Korea University Korean Language Education Program"`
   - **Study Period**: Covers `"DEC.2026 – NOV.2027"`
   - **English Certificate Text (2nd English Paragraph)**: Covers `"This is to certify that students who complete the Korean Language Program..."`

---

## 🔤 Font Engineering (Critical)

1. **Authentic TrueType Typography**: Does **NOT** use `pdf-lib`'s built-in `StandardFonts.TimesRoman` (which lacks true Times New Roman glyph contours and metrics).
2. **TTF Embedding Pipeline**:
   - Fetches the authentic TrueType font file from `/public/fonts/TimesNewRoman.ttf`.
   - Reads the font into an `ArrayBuffer` and converts to `Uint8Array`.
   - Registers `@pdf-lib/fontkit` and embeds into the document:
     ```ts
     pdfDoc.registerFontkit(fontkit);
     const embeddedFont = await pdfDoc.embedFont(fontBytes, { subset: true });
     ```
3. **Exact Metrics & Letter Spacing**: Uses the embedded font's exact character advance widths via `font.widthOfTextAtSize` for pixel-perfect word wrapping and baseline alignment.

---

## 📐 Target Fields & Hardcoded Coordinates

All coordinates are in standard PDF points (Page size: 595 × 841 pt):

| Target Field | PDF Coordinates (X, Y, W, H) | Font Size | Action |
|---|---|---|---|
| **Course Name** | `X: 145.0, Y: 546.0, W: 360.0, H: 18.0` | 10.5 pt | Solid white rectangle `rgb(1,1,1)`, redraw new course text |
| **Study Period** | `X: 270.0, Y: 524.0, W: 150.0, H: 18.0` | 10.5 pt | Solid white rectangle `rgb(1,1,1)`, redraw new study period text |
| **English Certificate Text** | `X: 88.0, Y: 254.0, W: 426.0, H: 64.0` | 10.5 pt | Solid white rectangle `rgb(1,1,1)`, redraw via `drawWrappedText` |

### Critical Multiline Word Wrapping (`/lib/pdf-utils.ts`)
`pdf-lib` does not wrap text natively. Achudami includes the exact `drawWrappedText` utility:
```ts
export function drawWrappedText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: PDFFont,
  page: PDFPage,
  color: RGB = rgb(0, 0, 0)
): { lines: string[]; finalY: number }
```
It splits text by spaces, computes width using `font.widthOfTextAtSize`, and drops down to the next line by decrementing `Y -= fontSize * 1.2` when width exceeds `maxWidth`.

---

## 🛠️ Debug Mode & Calibration

The UI features a **"Debug Mode"** switch:
- When toggled **ON**, the engine overlays red border rectangles (`borderColor: rgb(1, 0, 0)`, `borderWidth: 1.5`, translucent fill) directly onto the original PDF.
- The user can visually inspect that the red rectangles precisely envelop the target text fields without obscuring the underlying document.
- Fine-tune controls allow adjusting `X`, `Y`, `Width`, `Height`, and `FontSize` for each field with immediate visual feedback.
- When toggled **OFF**, production mode applies pure solid whiteouts (`rgb(1, 1, 1)`) and redraws new text.

---

## 🚀 Setup & Development

### 1. Drop Font File
Ensure `TimesNewRoman.ttf` is present in `/public/fonts/TimesNewRoman.ttf` before starting:
```bash
# Verify the font file exists in public/fonts
ls -lh public/fonts/TimesNewRoman.ttf
```
*(An authentic TrueType Times New Roman font file is pre-bundled in `/public/fonts/TimesNewRoman.ttf`.)*

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production / Vercel
```bash
npm run build
npm run start
```

---

## 📱 UI/UX Flow

1. **Dark-Mode UI**: Built with Tailwind CSS and shadcn/ui components (`bg-zinc-950`, zinc dark palette).
2. **Upload Zone**: Accepts any input PDF or click **"Load Sample Acceptance Letter"** to load the bundled Korea University template.
3. **Input Form**: Three pre-populated inputs:
   - **Course Name**: `Korea University Korean Language Education Bachelor of Business Administration Program`
   - **Study Period**: `DEC.2026 – SEP.2032`
   - **English Certificate Text**: `This is to certify that the above-mentioned student has been accepted into the Korean Language Program of the 2026 Winter Regular Program at Korea University Korean Language Center. This is a prerequisite program designed to improve korean language proficiency, which is necessary for enrollment in the Bachelor of Business Administration program which will start from 2027-09-01`
4. **Debug Toggle**: Instantly highlights target boxes with red borders on the PDF.
5. **Generate & Download**: Processes the PDF in the browser and downloads `output.pdf`.

---

## 📁 Codebase Architecture

```
achudami/
├── app/
│   ├── layout.tsx            # Global metadata and dark-mode layout
│   ├── page.tsx              # Main application page orchestrating UI/UX flow
│   └── globals.css           # Tailwind CSS directives
├── components/
│   ├── BoundingBoxDrawer.tsx # Interactive canvas preview with debug red borders
│   ├── ComparisonViewer.tsx  # Side-by-side verification and output.pdf downloader
│   ├── FontManager.tsx       # Custom TTF inspection and manager
│   ├── Header.tsx            # Dark-mode header with branding and repo link
│   ├── InputForm.tsx         # Target fields form, debug switch, and download button
│   ├── UploadZone.tsx        # Drag-and-drop PDF upload zone
│   └── ui/                   # shadcn-style UI primitives (Button, Switch, Input, Card, Badge)
├── lib/
│   ├── pdf-utils.ts          # Core drawWrappedText, KU coordinates, & modifyKoreaUniversityPdf
│   ├── pdfProcessor.ts       # Whiteout and redraw processing pipeline
│   ├── presets.ts            # Calibrated Korea University acceptance letter presets
│   ├── coordinateUtils.ts    # Coordinate space conversion (Canvas <-> PDF Points)
│   ├── storage.ts            # LocalStorage persistence for fine-tuned coordinates
│   └── types.ts              # TypeScript interfaces and definitions
├── public/
│   ├── fonts/
│   │   ├── TimesNewRoman.ttf # Authentic Monotype Times New Roman TTF
│   │   └── NotoSerif-Regular.ttf
│   ├── samples/
│   │   └── sample-input.pdf  # Korea University Acceptance Letter template
│   └── pdf.worker.min.js     # PDF.js worker for client-side rendering
└── README.md
```

---

## 🔒 Privacy & Security

Achudami runs **100% client-side** in your browser:
- No file is ever uploaded to a server or external API.
- All PDF manipulation uses WebAssembly and JavaScript via `pdf-lib` and `@pdf-lib/fontkit`.
- Deployable to Vercel with zero serverless function overhead.
