"use client";

import React, { useRef, useState } from "react";
import { Upload, Type, Check, AlertCircle, FileCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { CustomFontData } from "@/lib/types";

interface FontManagerProps {
  customFont: CustomFontData | null;
  onCustomFontLoaded: (fontData: CustomFontData) => void;
  onApplyFontToAll: () => void;
}

export const FontManager: React.FC<FontManagerProps> = ({
  customFont,
  onCustomFontLoaded,
  onApplyFontToAll,
}) => {
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFontFile = async (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "ttf" && ext !== "otf") {
      setErrorMsg("Please upload a valid TrueType (.ttf) or OpenType (.otf) font file.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const fontName = file.name.replace(/\.(ttf|otf)$/i, "");

      onCustomFontLoaded({
        name: fontName,
        fileName: file.name,
        bytes,
      });
    } catch (err) {
      console.error("Failed to load custom font:", err);
      setErrorMsg("Failed to read font file. Please try another font file.");
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Custom Font Matching</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          fontkit engine
        </Badge>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Upload an exact matching <code>.ttf</code> or <code>.otf</code> font file (e.g. Batang,
        Malgun Gothic, Times New Roman) to match your document&apos;s typography with 100% fidelity.
      </p>

      <input
        type="file"
        ref={fontInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFontFile(e.target.files[0]);
          }
        }}
        accept=".ttf,.otf,font/ttf,font/otf"
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fontInputRef.current?.click()}
          className="text-xs h-7 gap-1.5 border-slate-700 text-slate-300 hover:text-white"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>{customFont ? "Replace Font File" : "Upload Custom .TTF Font"}</span>
        </Button>

        {customFont && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onApplyFontToAll}
            className="text-xs h-7 gap-1 text-indigo-300 hover:text-indigo-200"
          >
            <Check className="w-3 h-3" />
            <span>Apply to All Fields</span>
          </Button>
        )}
      </div>

      {customFont && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
          <FileCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">Loaded: <strong>{customFont.fileName}</strong> ({Math.round(customFont.bytes.byteLength / 1024)} KB)</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
