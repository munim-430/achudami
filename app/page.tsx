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
  DEFAULT_INITIAL_BOXES,
  DEFAULT_INITIAL_VALUES,
} from "@/lib/presets";
import {
  loadSavedBoundingBoxes,
  saveBoundingBoxesToStorage,
  loadSavedFieldValues,
  saveFieldValuesToStorage,
  resetStorageToDefaults,
  exportCalibrationAsJson,
  importCalibrationFromJson,
} from "@/lib/storage";
import { processPDFDocument } from "@/lib/pdfProcessor";
import {
  FileText,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  FileDown,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  // Document state
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("k.t. input.pdf");
  const [fileSize, setFileSize] = useState<number>(43139);

  // Field bounding boxes & values state
  const [boxes, setBoxes] = useState<FieldBoundingBox[]>(DEFAULT_INITIAL_BOXES);
  const [values, setValues] = useState<FieldValues>(DEFAULT_INITIAL_VALUES);
  const [activeFieldKey, setActiveFieldKey] = useState<string>("course");
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Custom font state
  const [customFont, setCustomFont] = useState<CustomFontData | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<ProcessPDFResult | null>(null);

  // Navigation tab for smaller screens or workflow focus
  const [activeTab, setActiveTab] = useState<"workspace" | "comparison">("workspace");

  const comparisonSectionRef = useRef<HTMLDivElement>(null);
  const fileInputImportRef = useRef<HTMLInputElement>(null);

  // Load saved configuration from localStorage on client mount
  useEffect(() => {
    const savedBoxes = loadSavedBoundingBoxes();
    const savedValues = loadSavedFieldValues();
    setBoxes(savedBoxes);
    setValues(savedValues);
  }, []);

  // Automatically load the default sample PDF on first mount if none is loaded
  useEffect(() => {
    async function loadInitialSample() {
      try {
        const res = await fetch("/samples/sample-input.pdf");
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          setOriginalPdfBytes(bytes);
          setFileName("k.t. input.pdf");
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

  // Export calibration settings as JSON
  const handleExportConfig = useCallback(() => {
    const jsonStr = exportCalibrationAsJson(boxes, values);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achudami_calibration_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [boxes, values]);

  // Import calibration settings from JSON
  const handleImportConfig = useCallback(() => {
    fileInputImportRef.current?.click();
  }, []);

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const text = await file.text();
      const imported = importCalibrationFromJson(text);
      if (imported) {
        setBoxes(imported.boxes);
        saveBoundingBoxesToStorage(imported.boxes);
        if (imported.values) {
          setValues(imported.values);
          saveFieldValuesToStorage(imported.values);
        }
        setErrorMessage(null);
      } else {
        setErrorMessage("Invalid calibration configuration file format.");
      }
    } catch {
      setErrorMessage("Failed to read calibration JSON file.");
    } finally {
      if (fileInputImportRef.current) {
        fileInputImportRef.current.value = "";
      }
    }
  };

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

  // Generate modified PDF
  const handleGenerate = async () => {
    if (!originalPdfBytes) {
      setErrorMessage("Please upload or load a PDF document first.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const result = await processPDFDocument({
        originalPdfBytes,
        boxes,
        values,
        customFontBytes: customFont ? customFont.bytes : null,
        customFontName: customFont ? customFont.name : undefined,
      });

      setGenerationResult(result);
      setActiveTab("comparison");

      // Smooth scroll to comparison preview
      setTimeout(() => {
        comparisonSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      console.error("PDF Processing Error:", err);
      const msg = err instanceof Error ? err.message : "Failed to process PDF document.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      {/* Hidden file input for JSON configuration import */}
      <input
        type="file"
        ref={fileInputImportRef}
        onChange={handleImportFileSelected}
        accept=".json,application/json"
        className="hidden"
      />

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

        {/* Workspace Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
          {/* Left Column: Interactive PDF Canvas & Calibration Overlay */}
          <div className="lg:col-span-7 flex flex-col min-h-[640px]">
            <BoundingBoxDrawer
              pdfBytes={originalPdfBytes}
              boxes={boxes}
              activeFieldKey={activeFieldKey}
              onActiveFieldChange={(key) => setActiveFieldKey(key)}
              onBoxChange={handleBoxChange}
              isCalibrating={isCalibrating}
              onToggleCalibration={() => setIsCalibrating((prev) => !prev)}
            />
          </div>

          {/* Right Column: Values Input Form & Typography Controls */}
          <div className="lg:col-span-5 flex flex-col min-h-[640px]">
            <InputForm
              boxes={boxes}
              values={values}
              activeFieldKey={activeFieldKey}
              onActiveFieldChange={(key) => setActiveFieldKey(key)}
              onValuesChange={handleValuesChange}
              onBoxChange={handleBoxChange}
              onResetToPreset={handleResetToPreset}
              onExportConfig={handleExportConfig}
              onImportConfig={handleImportConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasPdfLoaded={Boolean(originalPdfBytes)}
            />
          </div>
        </section>

        {/* Comparison & Output Download Section */}
        <section ref={comparisonSectionRef} className="pt-4 min-h-[600px]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                Modified Document Verification & Download
              </h2>
            </div>
            {generationResult && (
              <Badge variant="success" className="text-xs">
                Generated in {generationResult.processingTimeMs}ms
              </Badge>
            )}
          </div>

          <ComparisonViewer
            originalPdfBytes={originalPdfBytes}
            modifiedPdfBytes={generationResult ? generationResult.pdfBytes : null}
            modifiedBlobUrl={generationResult ? generationResult.blobUrl : null}
            fileName={fileName}
            processingTimeMs={generationResult?.processingTimeMs}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
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
          <p className="text-slate-600">Built for Vercel deployment with Next.js 14 & pdf-lib</p>
        </div>
      </footer>
    </div>
  );
}
