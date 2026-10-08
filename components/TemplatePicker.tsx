"use client";

import React from "react";
import { TemplateId, TEMPLATE_REGISTRY } from "@/lib/templates";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { GraduationCap, Sparkles, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  currentTemplate: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
  onLoadSample: (samplePath: string, fileName: string) => void;
  isAutoDetected: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  currentTemplate,
  onSelectTemplate,
  onLoadSample,
  isAutoDetected,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>University Template Detector</span>
              <Badge
                variant={
                  currentTemplate === "unsupported"
                    ? "destructive"
                    : isAutoDetected
                    ? "success"
                    : "default"
                }
                className="text-[10px] font-mono px-2 py-0"
              >
                {currentTemplate === "unsupported"
                  ? "UNSUPPORTED"
                  : isAutoDetected
                  ? "AUTO-DETECTED"
                  : "ACTIVE TEMPLATE"}
              </Badge>
            </h3>
            <p className="text-xs text-zinc-400">
              Deterministic routing based on document markers and typography
            </p>
          </div>
        </div>

        {/* Template Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSelectTemplate("hanyang")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
              currentTemplate === "hanyang"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>Hanyang Univ.</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTemplate("korea")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
              currentTemplate === "korea"
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>Korea Univ.</span>
          </button>
        </div>
      </div>

      {/* Template Info & Quick Test Samples */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-zinc-400 flex items-center gap-2">
          {currentTemplate === "hanyang" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Hanyang University</strong>: Confirmation of Acceptance (지원과정, 교육기간,
                English Certificate).
              </span>
            </>
          ) : currentTemplate === "korea" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Korea University</strong>: Letter of Acceptance (Course Name, Study Period,
                English Certificate).
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-rose-300">
                Uploaded document does not match Hanyang or Korea University templates.
              </span>
            </>
          )}
        </div>

        {/* Sample Load Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-zinc-500">Test Samples:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 border-zinc-700 hover:border-indigo-500 text-zinc-300"
            onClick={() => onLoadSample("/reference/hanyang-input.pdf", "HANYANG COA input.pdf")}
          >
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
            Hanyang Sample
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 border-zinc-700 hover:border-indigo-500 text-zinc-300"
            onClick={() => onLoadSample("/samples/sample-input.pdf", "k.t. input.pdf")}
          >
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
            Korea Univ Sample
          </Button>
        </div>
      </div>
    </div>
  );
};
