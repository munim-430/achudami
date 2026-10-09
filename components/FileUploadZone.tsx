"use client";

import React, { useRef } from "react";
import { FileSpreadsheet, FileText, Upload, Download } from "lucide-react";
import { UniversityId, UNIVERSITIES } from "@/lib/types";
import { generateSampleExcelBuffer } from "@/lib/excelParser";

interface FileUploadZoneProps {
  currentUniversity: UniversityId;
  onExcelLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  onTemplateLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  excelFileName: string | null;
  templateFileName: string | null;
  isLoading: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  currentUniversity,
  onExcelLoaded,
  onTemplateLoaded,
  excelFileName,
  templateFileName,
  isLoading,
}) => {
  const excelInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const uConfig = UNIVERSITIES[currentUniversity];

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

  const handleDownloadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const buffer = generateSampleExcelBuffer(currentUniversity);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = uConfig.sampleExcelFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      alert("Error generating sample Excel: " + (err.message || String(err)));
    }
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
                <span>1. Upload Student Excel ({uConfig.name})</span>
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
            onClick={handleDownloadSample}
            type="button"
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
            title="Download formatted sample Excel intake template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {uConfig.name} Template (.xlsx)</span>
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
                  {templateFileName ? "CUSTOM" : `${uConfig.badge} DEFAULT`}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Crisp vector base template active for {uConfig.name}
              </p>
            </div>
          </div>
          <Upload className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition" />
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
          <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[200px]">
            {templateFileName || `${uConfig.name} Official Base Template`}
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
