# Achudami — Pixel-Perfect Client-Side PDF Text Modifier

> **Repository**: [munim-430/achudami](https://github.com/munim-430/achudami)  
> **Deployment Target**: Vercel (100% Client-Side Processing • Zero Backend • Zero API Routes)

Achudami is a high-performance Next.js 14+ web application that modifies targeted text fields in uploaded PDF documents with pixel-perfect fidelity. Built with **pdf-lib**, **@pdf-lib/fontkit**, and **pdfjs-dist**, all parsing, coordinate calibration, white-out masking, and vector font redraws occur entirely in the user's browser without transferring sensitive documents to any external server.

---

## 🎯 The "Pixel-Perfect" PDF Engine Strategy

Standard PDF libraries cannot natively edit compiled binary text streams without altering original fonts, vector glyph tables, and layout kerning. Achudami solves this using the deterministic **"White-Out and Redraw"** method:

```
[ Uploaded PDF ] ──> [ PDF.js Canvas Render ] ──> [ Interactive Coordinate Calibration ]
                             │
                             ▼
               [ Exact Bounding Box Selected ]
                             │
                             ▼
         [ Step 1: Draw Solid White Eraser Box ]
           page.drawRectangle({ x, y, width, height, color: rgb(1,1,1) })
                             │
                             ▼
         [ Step 2: Measure & Auto-Wrap Multi-Line Text ]
           font.widthOfTextAtSize(word, fontSize)
                             │
                             ▼
         [ Step 3: Draw Vector Text with Matched Baseline & Alignment ]
           page.drawText(line, { x, y: baseline - i * lineHeight, font, size, color })
                             │
                             ▼
       [ Modified PDF Generated (Blob URL & Side-by-Side Verification) ]
```

1. **Precision Calibration Mode**: Visual canvas overlay where users can click and drag rectangles directly over original text streams. Bounding boxes track exact standard PDF point coordinates (`72 pt = 1 inch`, origin bottom-left).
2. **Solid Vector Masking**: Erases previous text using vector rectangles with sub-pixel padding to prevent edge bleed.
3. **Typography & Font Matching**: Uses standard PDF fonts (`TimesRoman`, `Helvetica`, `Courier`), bundled high-resolution TTF fonts (`Noto Serif`, `DejaVu Sans`), or custom user-uploaded `.ttf`/`.otf` files via `@pdf-lib/fontkit`.
4. **Multi-Line Auto-Wrapping**: Computes text glyph metrics and wraps paragraphs cleanly into defined bounding box widths.
5. **Side-by-Side & Toggle Diff**: Real-time visual comparison of original vs. modified documents with synchronous canvas rendering.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js `18.18+` or `20.x`+ (`node -v`)
- npm, pnpm, or bun

### 1. Clone & Navigate
```bash
git clone https://github.com/munim-430/achudami.git
cd achudami
```

### 2. Install Dependencies
```bash
npm install
```

Required packages installed:
- `next@14.2.15`: React framework (App Router)
- `react@18.3.1` & `react-dom@18.3.1`: UI runtime
- `pdf-lib@1.17.1`: Client-side PDF manipulation engine
- `@pdf-lib/fontkit@1.1.1`: Custom TTF/OTF font parser and embedder
- `pdfjs-dist@3.11.174`: High-precision canvas PDF renderer
- `tailwindcss@3.4.14`: Modern responsive utility styling
- `lucide-react`: Clean SVG iconography
- `canvas-confetti`: Completion feedback animations

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Vercel Deployment

### Build Locally
```bash
npm run build
npm run start
```

### Deploy to Vercel

#### Option A: Manual Vercel CLI Deployment
```bash
# Install Vercel CLI globally if not already installed
npm install -g vercel

# Deploy preview build
vercel

# Deploy directly to production
vercel --prod
```

#### Option B: Deploy via GitHub & Vercel Dashboard
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/munim-430/achudami.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import the `munim-430/achudami` repository.
4. Framework preset will automatically detect **Next.js**.
5. Click **Deploy**. No environment variables or database credentials required!

---

## 📐 Pre-Calibrated Layout: Korea University Acceptance Letter

The application comes pre-loaded with exact calibration coordinates and sample values matching official Korea University Korean Language Center (KU KLC) Letters of Acceptance (`k.t. input.pdf` → `K.t. output.pdf`):

| Target Field | Original Value | Replacement Value | PDF Coordinates (pt) | Typography |
| :--- | :--- | :--- | :--- | :--- |
| **Course Name** | `Korea University Korean Language Education Program` | `Korea University Korean Language Education` | `x: 147.28, y: 546.0`<br>`w: 358.0, h: 16.0` | Times Roman, `10.2 pt`, Left |
| **Study Period** | `DEC.2026 – NOV.2027` | `DEC.2026 – SEP.2032` | `x: 273.69, y: 525.5`<br>`w: 143.0, h: 16.0` | Times Roman, `10.2 pt`, Left |
| **English Certificate Text** | 3-line acceptance paragraph | Multi-line acceptance paragraph with degree progression notice | `x: 88.0, y: 356.0`<br>`w: 426.0, h: 60.0` | Times Roman, `9.2 pt`, Line Height: `12.5 pt`, Auto-wrapped |

*Note: You can easily calibrate any other document by clicking "Calibrate Coordinates" and dragging rectangles over desired text areas.*

---

## 📁 Project Structure

```
achudami/
├── app/
│   ├── globals.css              # Dark theme CSS variables, typography, scrollbars
│   ├── layout.tsx               # Root Next.js layout and metadata
│   └── page.tsx                 # Main application controller & state coordinator
├── components/
│   ├── BoundingBoxDrawer.tsx    # Interactive PDF.js canvas with drag-to-calibrate handles
│   ├── ComparisonViewer.tsx     # Side-by-side & toggle comparison with PDF download
│   ├── FontManager.tsx          # Custom TTF/OTF font uploader via fontkit
│   ├── Header.tsx               # Application header with GitHub repository links
│   ├── InputForm.tsx            # Reactive text inputs, coordinate nudge controls, presets
│   ├── UploadZone.tsx           # Drag-and-drop PDF uploader with 1-click sample loader
│   └── ui/                      # Minimal, clean design system components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       ├── Tabs.tsx
│       └── Textarea.tsx
├── lib/
│   ├── coordinateUtils.ts       # Mathematical transforms between Canvas (top-left) & PDF (bottom-left)
│   ├── pdfProcessor.ts          # Core pdf-lib engine (white-out, word-wrap, vector draw)
│   ├── presets.ts               # Pre-calibrated bounding box templates
│   ├── storage.ts               # LocalStorage persistence & JSON import/export
│   ├── types.ts                 # Strict TypeScript interfaces (Zero 'any')
│   └── utils.ts                 # Class merging utility (clsx + tailwind-merge)
├── public/
│   ├── fonts/                   # High-res bundled TTF fonts (Noto Serif, DejaVu Sans)
│   ├── samples/                 # Sample acceptance letter input and target output
│   └── pdf.worker.min.js        # Self-contained standalone PDF.js worker
├── next.config.mjs              # Next.js configuration (canvas/encoding stubs)
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # Strict TypeScript configuration
├── vercel.json                  # Vercel deployment specification
└── README.md                    # Project documentation
```

---

## 🔒 Privacy & Security

Achudami processes all documents 100% locally in the browser:
- No file is uploaded to an external server or third-party cloud.
- No database or backend storage.
- Safe for confidential certificates, transcripts, and identification documents.

---

## 📄 License

MIT © [munim-430](https://github.com/munim-430)
