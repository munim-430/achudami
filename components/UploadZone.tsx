"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileLoaded: (fileData: {
    bytes: Uint8Array;
    name: string;
    size: number;
  }) => void;
  currentFileName?: string;
  currentFileSize?: number;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileLoaded,
  currentFileName,
  currentFileSize,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setErrorMessage("Please select a valid PDF document (.pdf).");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      onFileLoaded({
        bytes,
        name: file.name,
        size: file.size,
      });
    } catch (err) {
      console.error("Error reading file:", err);
      setErrorMessage("Failed to read the selected PDF file. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const loadSampleDocument = async () => {
    setLoadingSample(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/samples/sample-input.pdf");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch sample PDF`);
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      onFileLoaded({
        bytes,
        name: "k.t. input.pdf",
        size: bytes.byteLength,
      });
    } catch (err) {
      console.error("Error loading sample document:", err);
      setErrorMessage("Unable to load the bundled sample PDF. Please upload your file directly.");
    } finally {
      setLoadingSample(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed p-7 transition-all duration-200 text-center flex flex-col items-center justify-center",
          isDragging
            ? "border-indigo-500 bg-indigo-950/30 scale-[1.01]"
            : "border-slate-700/80 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/70"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
          accept="application/pdf,.pdf"
          className="hidden"
        />

        <div className="p-3.5 rounded-full bg-indigo-950/60 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-900/60 transition-all duration-200 mb-3 shadow-inner">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h4 className="text-base font-semibold text-slate-100 mb-1">
          {currentFileName ? "Replace PDF Document" : "Upload Target PDF Document"}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          Drag and drop your PDF here, or click to browse. Processing is 100% client-side and never leaves your browser.
        </p>

        {currentFileName ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-indigo-200 text-xs mt-1">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="font-medium max-w-[200px] truncate">{currentFileName}</span>
            <Badge variant="default" className="text-[10px] py-0 px-1.5">
              {formatFileSize(currentFileSize)}
            </Badge>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-slate-500 text-xs">
            <span>Supports standard PDF 1.3 - 2.0</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[11px] text-slate-500">Need a test document?</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            loadSampleDocument();
          }}
          disabled={loadingSample || isLoading}
          className="text-xs h-7 gap-1.5 border-indigo-900/60 hover:border-indigo-600/60 text-indigo-300 hover:text-indigo-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {loadingSample ? "Loading Preset PDF..." : "Load Sample Acceptance Letter"}
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
