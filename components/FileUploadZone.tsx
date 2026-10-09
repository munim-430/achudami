"use client";

import React, { useRef } from "react";
import { FileSpreadsheet, FileText, Upload, Sparkles, CheckCircle2 } from "lucide-react";

interface FileUploadZoneProps {
  onExcelLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  onTemplateLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  excelFileName: string | null;
  templateFileName: string | null;
  onLoadSampleData: () => void;
  isLoading: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onExcelLoaded,
  onTemplateLoaded,
  excelFileName,
  templateFileName,
  onLoadSampleData,
  isLoading,
}) => {
  const excelInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result instanceof ArrayBuffer) {
        onExcelLoaded(evt.target.result, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result instanceof ArrayBuffer) {
        onTemplateLoaded(evt.target.result, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. EXCEL DATA SOURCE */}
      <div
        onClick={() => excelInputRef.current?.click()}
        className="p-5 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/60 hover:border-indigo-500/80 hover:bg-zinc-900 transition cursor-pointer flex flex-col justify-between space-y-4 group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>1. Upload Student Excel / CSV</span>
                {excelFileName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    LOADED
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                Accepts .xlsx or .csv student acceptance list
              </p>
            </div>
          </div>
          <Upload className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition" />
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
          <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[200px]">
            {excelFileName || "No file selected"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSampleData();
            }}
            disabled={isLoading}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            <span>Load 60-Student Sample</span>
          </button>
        </div>
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelChange}
          className="hidden"
        />
      </div>

      {/* 2. TEMPLATE PDF */}
      <div
        onClick={() => templateInputRef.current?.click()}
        className="p-5 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/60 hover:border-indigo-500/80 hover:bg-zinc-900 transition cursor-pointer flex flex-col justify-between space-y-4 group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/80 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>2. Template PDF</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                  {templateFileName ? "CUSTOM" : "HANYANG ACTIVE"}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pre-bundled Hanyang template active (or upload custom PDF)
              </p>
            </div>
          </div>
          <Upload className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition" />
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
          <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[200px]">
            {templateFileName || "Hanyang Base Template (Active)"}
          </span>
          <span className="text-[11px] text-zinc-500">
            Click to replace template
          </span>
        </div>
        <input
          ref={templateInputRef}
          type="file"
          accept=".pdf"
          onChange={handleTemplateChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
