# Template Editor for Three Mentioned Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Achudami is a high-precision, client-side PDF modifier that targets three specific fields in university acceptance documents:
1. **Course Name** (`course` / Applying Course)
2. **Study Period** (`studyPeriod` / Education Period)
3. **Certificate Paragraph** (`certText` / English Certificate Text)

This plan transforms Achudami from a hardcoded 2-university modifier into a **Universal Template Editor and Modifier** for these three fields. Users can:
- Visually drag, resize, and calibrate the 3 bounding boxes directly on top of any uploaded PDF using the interactive canvas drawer.
- Fine-tune coordinates (X, Y, W, H), typography (font size, line height, alignment, multiline), and whiteout settings with numeric nudge controls.
- Save custom templates to browser LocalStorage, import/export templates as JSON, and auto-detect them via text markers.
- Switch seamlessly between **Fill & Generate** mode and **Template Editor** mode.
- Retain official Hanyang University and Korea University built-in presets.

---

## Proposed Architecture & File Structure

```
lib/
├── types.ts                  # DocumentTemplate & updated interfaces
├── presets.ts                # Built-in presets (Korea LOA, Korea LOA P1, Hanyang COA, Default Starter)
├── storage.ts                # LocalStorage management + JSON export/import for templates
├── templates/
│   ├── index.ts              # Template registry, dynamic detector supporting custom templates
│   ├── hanyang.ts            # Hanyang isolated handler
│   └── korea.ts              # Korea isolated handler
├── pdfProcessor.ts           # Client-side 3-field solid whiteout & Times New Roman redraw engine
components/
├── TemplateEditor.tsx        # NEW: Full template editor with field selector, nudging, and live canvas
├── BoundingBoxDrawer.tsx     # Interactive canvas drawer with 3-field drag/resize/zoom
├── CustomTemplateForm.tsx    # NEW: Fill & Generate form for any 3-field custom template
├── TemplatePicker.tsx        # Template switcher supporting built-ins + custom templates + "+ New Template"
├── ComparisonViewer.tsx      # Side-by-side original vs modified preview
app/
├── page.tsx                  # Dual-mode workspace (Fill & Generate vs Template Editor)
└── globals.css
```

---

## Tasks

- [ ] **Task 1: Extend Types & Storage for Document Templates**
  - Define `DocumentTemplate` interface in `lib/types.ts`.
  - Add template persistence functions in `lib/storage.ts`: `loadCustomTemplates`, `saveCustomTemplate`, `deleteCustomTemplate`, `exportTemplateAsJson`, `importTemplateFromJson`.
  - Add default starter template preset in `lib/presets.ts`.

- [ ] **Task 2: Dynamic Template Registry & Detection**
  - Update `lib/templates/index.ts` so `detectTemplate` checks built-in templates and custom saved templates via `textMarkers`.
  - Export unified helper to get template by ID or create new template draft.

- [ ] **Task 3: Build `CustomTemplateForm` Component**
  - Create `components/CustomTemplateForm.tsx` to handle filling values for the 3 fields (Course Name, Study Period, Certificate Text) and triggering generation/download for any custom or preset template.
  - Include quick link to switch to "Edit Template Coordinates".

- [ ] **Task 4: Build `TemplateEditor` Component**
  - Create `components/TemplateEditor.tsx` combining:
    - Template details (Name, ID, Text detection markers).
    - 3-field selector tabs (Course, Period, Certificate Text).
    - Numeric coordinate inputs with nudge buttons (+/- 1pt, +/- 5pt).
    - Typography controls (Font size, line height, multiline, alignment).
    - Whiteout controls (Padding, color).
    - Default value text inputs.
    - Template actions: Save to LocalStorage, Export JSON, Import JSON, Delete, Reset.
    - Integrated interactive `BoundingBoxDrawer` showing live drag/resize boxes on the PDF canvas.

- [ ] **Task 5: Upgrade `TemplatePicker` and Main Workspace in `app/page.tsx`**
  - Update `components/TemplatePicker.tsx` to display built-in templates, saved custom templates, and a "+ New Template" button.
  - Update `app/page.tsx` to support:
    - Mode toggle: `Fill & Generate` vs `Template Editor`.
    - Routing custom templates through `CustomTemplateForm` + `processPDFDocument`.
    - Seamless transition when an unknown PDF is uploaded to allow 1-click template creation.
  - Fix build script in `package.json` to include `JITI_CACHE=false`.

- [ ] **Task 6: Verification & End-to-End Build Test**
  - Verify TypeScript compilation and production build (`npm run build`).
  - Test template creation, bounding box drag-and-drop, export/import JSON, and PDF generation.
