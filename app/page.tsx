"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { BoundingBoxDrawer } from "@/components/BoundingBoxDrawer";
import { InputForm } from "@/components/InputForm";
import { ComparisonViewer } from "@/components/ComparisonViewer";
import { FontManager } from "@/components/FontManager";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FieldBoundingBox,
  FieldValues,
  CustomFontData,
  ProcessPDFResult,
} from "@/lib/types";
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
import {
  FileText,
  Sparkles,
  AlertTriangle,
  Download,
  Bug,
  Eye,
  Sliders,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  // Document state
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("sample-input.pdf");
  const [fileSize, setFileSize] = useState<number>(43139);

  // Field bounding boxes & values state
  const [boxes, setBoxes] = useState<FieldBoundingBox[]>(DEFAULT_INITIAL_BOXES);
  const [values, setValues] = useState<FieldValues>(DEFAULT_INITIAL_VALUES);
  const [activeFieldKey, setActiveFieldKey] = useState<string>("course");
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Debug mode toggle state
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Custom font state (defaults to authentic Times New Roman TTF)
  const [customFont, setCustomFont] = useState<CustomFontData | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<ProcessPDFResult | null>(null);

  // Active view tab: "editor" | "output"
  const [activeTab, setActiveTab] = useState<"editor" | "output">("editor");

  const comparisonSectionRef = useRef<HTMLDivElement>(null);

  // Load saved configuration from localStorage on client mount
  useEffect(() => {
    const savedBoxes = loadSavedBoundingBoxes();
    const savedValues = loadSavedFieldValues();
    // Verify saved boxes have valid coordinates, else use calibrated defaults
    if (savedBoxes && savedBoxes.length === 3 && savedBoxes.find((b) => b.key === "certText" && b.y < 350)) {
      setBoxes(savedBoxes);
    } else {
      setBoxes(DEFAULT_INITIAL_BOXES);
    }

    if (savedValues && savedValues.course && savedValues.studyPeriod) {
      setValues(savedValues);
    } else {
      setValues(DEFAULT_INITIAL_VALUES);
    }
  }, []);

  // Automatically load the default sample PDF on first mount
  useEffect(() => {
    async function loadInitialSample() {
      try {
        const res = await fetch("/samples/sample-input.pdf");
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          setOriginalPdfBytes(bytes);
          setFileName("sample-input.pdf");
          setFileSize(bytes.byteLength);
        }
      } catch (err) {
        console.warn("Auto-load of sample PDF skipped:", err);
      }
    }
    loadInitialSample();
  }, []);

  // Update a single bounding box and sync to storage
  const handleBoxChange = useCallback((updatedBox: FieldBoundingBox) => {
    setBoxes((prev) => {
      const next = prev.map((b) => (b.key === updatedBox.key ? updatedBox : b));
      saveBoundingBoxesToStorage(next);
      return next;
    });
  }, []);

  // Update field values and sync to storage
  const handleValuesChange = useCallback((newValues: FieldValues) => {
    setValues(newValues);
    saveFieldValuesToStorage(newValues);
  }, []);

  // Reset to default Korea University Acceptance Letter preset
  const handleResetToPreset = useCallback(() => {
    const { boxes: defBoxes, values: defValues } = resetStorageToDefaults();
    setBoxes(defBoxes);
    setValues(defValues);
    setActiveFieldKey("course");
    setErrorMessage(null);
  }, []);

  // Select a preset (e.g. 2nd para vs 1st para)
  const handleSelectPreset = useCallback((presetId: string) => {
    const targetPreset =
      presetId === KU_FIRST_PARAGRAPH_PRESET.id
        ? KU_FIRST_PARAGRAPH_PRESET
        : KU_ACCEPTANCE_LETTER_PRESET;

    setBoxes(targetPreset.boxes);
    saveBoundingBoxesToStorage(targetPreset.boxes);
    setErrorMessage(null);
  }, []);

  // Apply custom uploaded font to all fields
  const handleApplyFontToAll = useCallback(() => {
    if (!customFont) return;
    setBoxes((prev) => {
      const next = prev.map((b) => ({
        ...b,
        fontFamily: "custom",
      }));
      saveBoundingBoxesToStorage(next);
      return next;
    });
  }, [customFont]);

  // Execute PDF generation (with debugMode flag support)
  const executeGeneration = useCallback(
    async (targetDebugMode: boolean): Promise<ProcessPDFResult | null> => {
      if (!originalPdfBytes) {
        setErrorMessage("Please upload or load a PDF document first.");
        return null;
      }

      try {
        setIsGenerating(true);
        setErrorMessage(null);

        const result = await processPDFDocument({
          originalPdfBytes,
          boxes,
          values,
          debugMode: targetDebugMode,
          customFontBytes: customFont ? customFont.bytes : null,
          customFontName: customFont ? customFont.name : undefined,
        });

        setGenerationResult(result);
        return result;
      } catch (err) {
        console.error("PDF Processing Error:", err);
        const msg = err instanceof Error ? err.message : "Failed to process PDF document.";
        setErrorMessage(msg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [originalPdfBytes, boxes, values, customFont]
  );

  // Handle "Generate & Download" button click
  const handleGenerateAndDownload = async () => {
    const result = await executeGeneration(debugMode);
    if (result && result.pdfBytes) {
      triggerPdfDownload(result.pdfBytes, "output.pdf");
      setActiveTab("output");
      setTimeout(() => {
        comparisonSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  };

  // Automatically refresh preview when debugMode changes or when initial PDF loads
  useEffect(() => {
    if (!originalPdfBytes) return;

    const timer = setTimeout(() => {
      executeGeneration(debugMode);
    }, 200);

    return () => clearTimeout(timer);
  }, [originalPdfBytes, debugMode, boxes, values, executeGeneration]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Bar: Upload & Fast Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <UploadZone
              onFileLoaded={(fileData) => {
                setOriginalPdfBytes(fileData.bytes);
                setFileName(fileData.name);
                setFileSize(fileData.size);
                setGenerationResult(null);
                setErrorMessage(null);
              }}
              currentFileName={fileName}
              currentFileSize={fileSize}
              isLoading={isGenerating}
            />
          </div>

          <div className="space-y-4">
            <FontManager
              customFont={customFont}
              onCustomFontLoaded={(fontData) => setCustomFont(fontData)}
              onApplyFontToAll={handleApplyFontToAll}
            />
          </div>
        </section>

        {/* Global Error Banner if any */}
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

        {/* View Tabs Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "editor"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Editor & Calibration</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("output")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "output"
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Comparison & Output View</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1.5 font-semibold"
              disabled={!originalPdfBytes || isGenerating}
              onClick={handleGenerateAndDownload}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate & Download output.pdf</span>
            </Button>
          </div>
        </div>

        {/* Workspace Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
          {/* Left Column: Interactive PDF Canvas & Debug/Calibration Overlay */}
          <div className="lg:col-span-7 flex flex-col min-h-[640px]">
            {activeTab === "editor" ? (
              <BoundingBoxDrawer
                pdfBytes={originalPdfBytes}
                boxes={boxes}
                activeFieldKey={activeFieldKey}
                onActiveFieldChange={(key) => setActiveFieldKey(key)}
                onBoxChange={handleBoxChange}
                isCalibrating={isCalibrating}
                onToggleCalibration={() => setIsCalibrating((prev) => !prev)}
                debugMode={debugMode}
              />
            ) : (
              <ComparisonViewer
                originalPdfBytes={originalPdfBytes}
                modifiedPdfBytes={generationResult ? generationResult.pdfBytes : null}
                modifiedBlobUrl={generationResult ? generationResult.blobUrl : null}
                fileName="output.pdf"
                processingTimeMs={generationResult?.processingTimeMs}
                debugMode={debugMode}
              />
            )}
          </div>

          {/* Right Column: Values Input Form & Debug Controls */}
          <div className="lg:col-span-5 flex flex-col min-h-[640px]">
            <InputForm
              boxes={boxes}
              values={values}
              debugMode={debugMode}
              onDebugModeChange={setDebugMode}
              onValuesChange={handleValuesChange}
              onBoxChange={handleBoxChange}
              onResetToPreset={handleResetToPreset}
              onSelectPreset={handleSelectPreset}
              onGenerateAndDownload={handleGenerateAndDownload}
              isGenerating={isGenerating}
              hasPdfLoaded={Boolean(originalPdfBytes)}
            />
          </div>
        </section>

        {/* Output & Side-by-Side Comparison Section */}
        <section ref={comparisonSectionRef} className="pt-4 min-h-[600px]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                Document Verification & High-Fidelity Comparison
              </h2>
            </div>
            {generationResult && (
              <Badge variant="default" className="text-xs font-mono">
                Processed in {generationResult.processingTimeMs}ms
              </Badge>
            )}
          </div>

          <ComparisonViewer
            originalPdfBytes={originalPdfBytes}
            modifiedPdfBytes={generationResult ? generationResult.pdfBytes : null}
            modifiedBlobUrl={generationResult ? generationResult.blobUrl : null}
            fileName="output.pdf"
            processingTimeMs={generationResult?.processingTimeMs}
            debugMode={debugMode}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Achudami • Client-Side Pixel-Perfect PDF Engine • Repository:{" "}
            <a
              href="https://github.com/munim-430/achudami"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              munim-430/achudami
            </a>
          </p>
          <p className="text-zinc-600">Built for Vercel deployment with Next.js 14 & pdf-lib</p>
        </div>
      </footer>
    </div>
  );
}
