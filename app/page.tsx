"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { TemplatePicker } from "@/components/TemplatePicker";
import { HanyangForm } from "@/components/HanyangForm";
import { KoreaForm } from "@/components/KoreaForm";
import { ComparisonViewer } from "@/components/ComparisonViewer";
import { FontManager } from "@/components/FontManager";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  TemplateId,
  detectTemplate,
  TEMPLATE_REGISTRY,
  HANYANG_DEFAULT_VALUES,
  HanyangTemplateValues,
  handleHanyangTemplate,
  ProcessHanyangResult,
} from "@/lib/templates";
import {
  KU_ACCEPTANCE_LETTER_PRESET,
  KU_FIRST_PARAGRAPH_PRESET,
  DEFAULT_INITIAL_BOXES,
  DEFAULT_INITIAL_VALUES,
} from "@/lib/presets";
import {
  loadSavedBoundingBoxes,
  saveBoundingBoxesToStorage,
  loadSavedFieldValues,
  saveFieldValuesToStorage,
  resetStorageToDefaults,
} from "@/lib/storage";
import { processPDFDocument } from "@/lib/pdfProcessor";
import { triggerPdfDownload } from "@/lib/pdf-utils";
import { analyzePdfDocument } from "@/lib/pdf/analyzer";
import { checkTimesNewRomanAvailable } from "@/lib/pdf/fontLoader";
import { ValidationResult } from "@/lib/pdf/validation";
import { FieldBoundingBox, FieldValues, CustomFontData, ProcessPDFResult } from "@/lib/types";
import {
  FileText,
  Sparkles,
  AlertTriangle,
  Download,
  Eye,
  Sliders,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  // Document state
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("HANYANG COA input.pdf");
  const [fileSize, setFileSize] = useState<number>(0);

  // Template routing state
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("hanyang");
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);

  // Hanyang-specific state
  const [hanyangValues, setHanyangValues] = useState<HanyangTemplateValues>(HANYANG_DEFAULT_VALUES);
  const [hanyangResult, setHanyangResult] = useState<ProcessHanyangResult | null>(null);
  const [hanyangValidation, setHanyangValidation] = useState<ValidationResult | null>(null);

  // Korea University-specific state
  const [koreaBoxes, setKoreaBoxes] = useState<FieldBoundingBox[]>(DEFAULT_INITIAL_BOXES);
  const [koreaValues, setKoreaValues] = useState<FieldValues>(DEFAULT_INITIAL_VALUES);
  const [koreaResult, setKoreaResult] = useState<ProcessPDFResult | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Font verification state
  const [isFontMissing, setIsFontMissing] = useState<boolean>(false);
  const [customFont, setCustomFont] = useState<CustomFontData | null>(null);

  // Processing state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comparisonSectionRef = useRef<HTMLDivElement>(null);

  // Initial font check
  useEffect(() => {
    async function verifyFont() {
      const available = await checkTimesNewRomanAvailable();
      setIsFontMissing(!available);
    }
    verifyFont();
  }, []);

  // Load initial sample on startup
  useEffect(() => {
    async function loadDefaultSample() {
      try {
        const res = await fetch("/reference/hanyang-input.pdf");
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          setOriginalPdfBytes(bytes);
          setFileName("HANYANG COA input.pdf");
          setFileSize(bytes.byteLength);

          // Detect template
          const analysis = await analyzePdfDocument(bytes);
          const detected = detectTemplate(analysis.rawText);
          setActiveTemplate(detected !== "unsupported" ? detected : "hanyang");
          setIsAutoDetected(true);
        }
      } catch (err) {
        console.warn("Auto-load of Hanyang sample skipped:", err);
      }
    }
    loadDefaultSample();
  }, []);

  // Handle uploaded or loaded PDF
  const handlePdfLoaded = async (fileData: { bytes: Uint8Array; name: string; size: number }) => {
    setOriginalPdfBytes(fileData.bytes);
    setFileName(fileData.name);
    setFileSize(fileData.size);
    setHanyangResult(null);
    setKoreaResult(null);
    setHanyangValidation(null);
    setErrorMessage(null);

    try {
      const analysis = await analyzePdfDocument(fileData.bytes);
      const detected = detectTemplate(analysis.rawText);
      setActiveTemplate(detected);
      setIsAutoDetected(true);
    } catch (err) {
      console.error("Template analysis error:", err);
      setActiveTemplate("unsupported");
    }
  };

  // Switch template manually
  const handleSelectTemplate = (templateId: TemplateId) => {
    setActiveTemplate(templateId);
    setIsAutoDetected(false);
    setErrorMessage(null);
  };

  // Load reference test samples
  const handleLoadSample = async (samplePath: string, sampleFileName: string) => {
    try {
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await handlePdfLoaded({
        bytes,
        name: sampleFileName,
        size: bytes.byteLength,
      });
    } catch (err) {
      console.error("Failed to load sample:", err);
      setErrorMessage(`Failed to load ${sampleFileName}.`);
    }
  };

  // --- HANYANG GENERATION PIPELINE ---
  const handleGenerateHanyang = async () => {
    if (!originalPdfBytes) {
      setErrorMessage("Please upload or load a Hanyang PDF first.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const result = await handleHanyangTemplate(originalPdfBytes, hanyangValues);
      setHanyangResult(result);
      setHanyangValidation(result.validation);

      setTimeout(() => {
        comparisonSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err) {
      console.error("Hanyang Generation Error:", err);
      const msg = err instanceof Error ? err.message : "Failed to generate Hanyang PDF.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadHanyang = () => {
    if (!hanyangResult?.pdfBytes) return;
    if (hanyangValidation && !hanyangValidation.valid) {
      setErrorMessage("Download blocked: Pre-download verification failed.");
      return;
    }
    triggerPdfDownload(hanyangResult.pdfBytes, "HANYANG output.pdf");
  };

  // --- KOREA UNIVERSITY GENERATION PIPELINE ---
  const handleGenerateKorea = async () => {
    if (!originalPdfBytes) {
      setErrorMessage("Please upload or load a PDF document first.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const result = await processPDFDocument({
        originalPdfBytes,
        boxes: koreaBoxes,
        values: koreaValues,
        debugMode,
        customFontBytes: customFont ? customFont.bytes : null,
      });

      setKoreaResult(result);
      setTimeout(() => {
        comparisonSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err) {
      console.error("Korea Univ Generation Error:", err);
      const msg = err instanceof Error ? err.message : "Failed to process Korea Univ PDF.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAndDownloadKorea = async () => {
    await handleGenerateKorea();
    if (koreaResult?.pdfBytes) {
      triggerPdfDownload(koreaResult.pdfBytes, "output.pdf");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Template Detector & Switcher */}
        <TemplatePicker
          currentTemplate={activeTemplate}
          onSelectTemplate={handleSelectTemplate}
          onLoadSample={handleLoadSample}
          isAutoDetected={isAutoDetected}
        />

        {/* Upload Zone */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <UploadZone
              onFileLoaded={handlePdfLoaded}
              currentFileName={fileName}
              currentFileSize={fileSize}
              isLoading={isGenerating}
            />
          </div>

          <div className="space-y-4">
            <FontManager
              customFont={customFont}
              onCustomFontLoaded={(fontData) => setCustomFont(fontData)}
              onApplyFontToAll={() => {}}
            />
          </div>
        </section>

        {/* Global Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setErrorMessage(null)}
              className="text-xs h-7 text-rose-300 border-rose-800 hover:bg-rose-900/60"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* FONT MISSING SCREEN WARNING */}
        {isFontMissing && (
          <div className="p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-600 text-rose-100 space-y-2 shadow-2xl">
            <div className="flex items-center gap-2 text-base font-bold text-rose-300">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <span>Times New Roman Font File Missing — Generation Blocked</span>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed max-w-3xl">
              Non-negotiable font rule: all replaced Latin-script text must use authentic Times New
              Roman typography. No substitute fonts are permitted. Please drop{" "}
              <code className="bg-rose-900/80 px-2 py-0.5 rounded text-white font-mono">
                TimesNewRoman.ttf
              </code>{" "}
              into the <code className="font-mono">/public/fonts/</code> directory.
            </p>
          </div>
        )}

        {/* TEMPLATE-ROUTED WORKSPACE */}
        {activeTemplate === "unsupported" ? (
          /* UNSUPPORTED TEMPLATE SCREEN */
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 space-y-4">
            <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <FileQuestion className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100">
                Unsupported Document Template
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                The uploaded PDF does not contain recognized text markers for{" "}
                <strong>Hanyang University</strong> or <strong>Korea University</strong>. Please
                upload an official Confirmation of Acceptance or select a test sample above.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleLoadSample("/reference/hanyang-input.pdf", "HANYANG COA input.pdf")
                }
              >
                Load Hanyang Sample
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLoadSample("/samples/sample-input.pdf", "k.t. input.pdf")}
              >
                Load Korea Univ Sample
              </Button>
            </div>
          </div>
        ) : (
          /* ACTIVE TEMPLATE FORM & PREVIEW */
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
            {/* Left Column: Form Controls according to Active Template */}
            <div className="lg:col-span-5 flex flex-col">
              {activeTemplate === "hanyang" ? (
                <HanyangForm
                  values={hanyangValues}
                  onValuesChange={setHanyangValues}
                  onGenerate={handleGenerateHanyang}
                  onDownload={handleDownloadHanyang}
                  isGenerating={isGenerating}
                  hasPdfLoaded={Boolean(originalPdfBytes)}
                  hasGeneratedOutput={Boolean(hanyangResult)}
                  validationResult={hanyangValidation}
                  isFontMissing={isFontMissing}
                />
              ) : (
                <KoreaForm
                  boxes={koreaBoxes}
                  values={koreaValues}
                  debugMode={debugMode}
                  onDebugModeChange={setDebugMode}
                  onValuesChange={setKoreaValues}
                  onBoxChange={(b) =>
                    setKoreaBoxes((prev) => prev.map((x) => (x.key === b.key ? b : x)))
                  }
                  onResetToPreset={() => {
                    const { boxes, values } = resetStorageToDefaults();
                    setKoreaBoxes(boxes);
                    setKoreaValues(values);
                  }}
                  onSelectPreset={(p) => {
                    const preset =
                      p === KU_FIRST_PARAGRAPH_PRESET.id
                        ? KU_FIRST_PARAGRAPH_PRESET
                        : KU_ACCEPTANCE_LETTER_PRESET;
                    setKoreaBoxes(preset.boxes);
                  }}
                  onGenerateAndDownload={handleGenerateAndDownloadKorea}
                  isGenerating={isGenerating}
                  hasPdfLoaded={Boolean(originalPdfBytes)}
                />
              )}
            </div>

            {/* Right Column: Live Comparison & Verification Viewer */}
            <div className="lg:col-span-7 flex flex-col" ref={comparisonSectionRef}>
              <ComparisonViewer
                originalPdfBytes={originalPdfBytes}
                modifiedPdfBytes={
                  activeTemplate === "hanyang"
                    ? hanyangResult?.pdfBytes || null
                    : koreaResult?.pdfBytes || null
                }
                modifiedBlobUrl={
                  activeTemplate === "hanyang"
                    ? hanyangResult?.blobUrl || null
                    : koreaResult?.blobUrl || null
                }
                fileName={
                  activeTemplate === "hanyang" ? "HANYANG output.pdf" : "output.pdf"
                }
                processingTimeMs={
                  activeTemplate === "hanyang"
                    ? hanyangResult?.processingTimeMs
                    : koreaResult?.processingTimeMs
                }
                debugMode={activeTemplate === "korea" && debugMode}
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Achudami • Multi-Template Client-Side PDF Engine (Korea Univ & Hanyang Univ) • Repository:{" "}
            <a
              href="https://github.com/munim-430/achudami"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              munim-430/achudami
            </a>
          </p>
          <p className="text-zinc-600">Vercel Ready • 100% Client-Side Processing</p>
        </div>
      </footer>
    </div>
  );
}
