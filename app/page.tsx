"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FileUploadZone } from "@/components/FileUploadZone";
import { StudentTable } from "@/components/StudentTable";
import { PreviewModal } from "@/components/PreviewModal";
import { LoginScreen } from "@/components/LoginScreen";
import { StudentRecord, GenerationProgress } from "@/lib/types";
import { parseExcelFile } from "@/lib/excelParser";
import {
  getDefaultTemplateBytes,
  getBundledFonts,
  generateSingleCertificate,
  generateBatchZip,
  downloadBlob,
} from "@/lib/pdfGenerator";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  FileArchive,
  Loader2,
  Info,
} from "lucide-react";

export default function HomePage() {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [templateBytes, setTemplateBytes] = useState<ArrayBuffer | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string | null>(null);
  const [isRawTemplate, setIsRawTemplate] = useState<boolean>(false);

  // Preview state
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Batch Generation State
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    currentName: "",
    isGenerating: false,
    error: null,
  });

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);

  // Verify auth session on client mount
  useEffect(() => {
    try {
      const isUnlocked = sessionStorage.getItem("achudami_auth") === "unlocked";
      setIsAuthenticated(isUnlocked);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Load initial clean template & sample 60-student excel on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    async function initDefaults() {
      try {
        // 1. Load clean base template
        const tplBytes = await getDefaultTemplateBytes();
        setTemplateBytes(tplBytes);

        // 2. Load 60-student sample Excel
        const sampleExcelRes = await fetch("/samples/Hanyang-Student-Acceptance-List-Sample.xlsx");
        if (sampleExcelRes.ok) {
          const sampleBuf = await sampleExcelRes.arrayBuffer();
          const parsed = parseExcelFile(sampleBuf);
          setRecords(parsed);
          setExcelFileName("Hanyang 2026 Winter - Student Acceptance List (60 students)");
        }
      } catch (err) {
        console.error("Failed to load initial defaults:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    }
    initDefaults();
  }, [isAuthenticated]);

  const handleLock = () => {
    try {
      sessionStorage.removeItem("achudami_auth");
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
  };

  // If still checking initial sessionStorage state, show blank dark canvas
  if (!authChecked) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  // If not authenticated, require passkey "Long Live Saem Sir"
  if (!isAuthenticated) {
    return <LoginScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  // Handle uploaded Excel
  const handleExcelLoaded = (buffer: ArrayBuffer, fileName: string) => {
    try {
      const parsed = parseExcelFile(buffer);
      if (parsed.length === 0) {
        alert("No valid student records found in the uploaded file.");
        return;
      }
      setRecords(parsed);
      setExcelFileName(fileName);
    } catch (err: any) {
      alert("Error parsing Excel file: " + (err.message || String(err)));
    }
  };

  // Handle uploaded custom template PDF
  const handleTemplateLoaded = (buffer: ArrayBuffer, fileName: string) => {
    setTemplateBytes(buffer);
    setTemplateFileName(fileName);
    setIsRawTemplate(true); // Custom uploaded PDFs undergo vector redaction pass
  };

  // Re-load bundled 60-student sample
  const handleLoadSampleData = async () => {
    setIsLoadingInitial(true);
    try {
      const sampleExcelRes = await fetch("/samples/Hanyang-Student-Acceptance-List-Sample.xlsx");
      const sampleBuf = await sampleExcelRes.arrayBuffer();
      const parsed = parseExcelFile(sampleBuf);
      setRecords(parsed);
      setExcelFileName("Hanyang 2026 Winter - Student Acceptance List (60 students)");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Single Student Preview Handler
  const handlePreview = async (record: StudentRecord) => {
    if (!templateBytes) {
      alert("Template PDF is not loaded yet.");
      return;
    }
    setPreviewStudent(record);
    setIsPreviewLoading(true);

    try {
      const { boldFont, regularFont } = await getBundledFonts();
      const pdfBytes = await generateSingleCertificate(
        record,
        templateBytes,
        boldFont,
        regularFont,
        isRawTemplate
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(newUrl);
    } catch (err: any) {
      alert("Error rendering preview: " + (err.message || String(err)));
      setPreviewStudent(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewStudent(null);
  };

  // Download Single Student PDF
  const handleDownloadSingle = async (record: StudentRecord) => {
    if (!templateBytes) return;
    try {
      const { boldFont, regularFont } = await getBundledFonts();
      const pdfBytes = await generateSingleCertificate(
        record,
        templateBytes,
        boldFont,
        regularFont,
        isRawTemplate
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      downloadBlob(blob, record.filename);
    } catch (err: any) {
      alert("Error downloading single PDF: " + (err.message || String(err)));
    }
  };

  // Batch Generation (All in 1-Click ZIP)
  const handleBatchGenerate = async () => {
    if (!templateBytes || records.length === 0) return;

    setProgress({
      current: 0,
      total: records.length,
      currentName: "Initializing...",
      isGenerating: true,
      error: null,
    });

    try {
      const { zipBlob } = await generateBatchZip(
        records,
        templateBytes,
        isRawTemplate,
        (current, total, name) => {
          setProgress({
            current,
            total,
            currentName: name,
            isGenerating: true,
            error: null,
          });
        }
      );

      const zipName = `Hanyang-University-2026-Winter-Certificates-${records.length}-Students.zip`;
      downloadBlob(zipBlob, zipName);

      setProgress((prev) => ({
        ...prev,
        isGenerating: false,
        currentName: "Complete! ZIP file downloaded.",
      }));
    } catch (err: any) {
      console.error(err);
      setProgress((prev) => ({
        ...prev,
        isGenerating: false,
        error: err.message || "An error occurred during batch generation",
      }));
    }
  };

  const percentComplete =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Header onLock={handleLock} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Visual Drift Two-Pass Vector Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Hanyang University Acceptance Letter Automation
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Generates publication-ready PDF certificates with 100% typographic alignment,
                vector-preserved university seals, Korean Hangul characters, and zero server round-trips.
              </p>
            </div>

            {/* Quick Batch CTA Card */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                type="button"
                onClick={handleBatchGenerate}
                disabled={progress.isGenerating || records.length === 0}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition"
              >
                {progress.isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing ({percentComplete}%)...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" />
                    <span>Generate All {records.length} Certificates (ZIP)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client-Side Processing (0s Server Queue)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar (when active or complete) */}
        {(progress.isGenerating || progress.current > 0) && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-2">
                {progress.isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {progress.currentName}
              </span>
              <span className="font-semibold text-indigo-400">
                {progress.current} / {progress.total} ({percentComplete}%)
              </span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2.5 transition-all duration-150 rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        )}

        {/* 1. Upload Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Pipeline Data Sources</span>
            </h3>
            <span className="text-xs text-zinc-500">
              Drag & drop files or click to replace
            </span>
          </div>

          <FileUploadZone
            onExcelLoaded={handleExcelLoaded}
            onTemplateLoaded={handleTemplateLoaded}
            excelFileName={excelFileName}
            templateFileName={templateFileName}
            onLoadSampleData={handleLoadSampleData}
            isLoading={isLoadingInitial}
          />
        </section>

        {/* 2. Student Records Table */}
        <section className="space-y-3">
          <StudentTable
            records={records}
            onPreview={handlePreview}
            onDownloadSingle={handleDownloadSingle}
            isProcessing={progress.isGenerating}
          />
        </section>

        {/* Footer info banner */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400" />
            <span>
              Engine powered by <code className="text-zinc-300">pdf-lib</code> + <code className="text-zinc-300">@pdf-lib/fontkit</code>. Tested for Korean glyphs with NanumGothic.
            </span>
          </div>
          <div>
            <span>HQ: Sobhanbag, Dhanmondi • Keystone Overseas</span>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={Boolean(previewStudent)}
        onClose={handleClosePreview}
        student={previewStudent}
        pdfUrl={previewPdfUrl}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
