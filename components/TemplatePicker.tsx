"use client";

import React from "react";
import { TemplateId, TEMPLATE_REGISTRY } from "@/lib/templates";
import { CalibrationPreset } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Sliders,
  FileEdit,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  currentTemplate: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
  onLoadSample: (samplePath: string, fileName: string) => void;
  isAutoDetected: boolean;
  customTemplates: CalibrationPreset[];
  activeMode: "form" | "editor";
  onModeChange: (mode: "form" | "editor") => void;
  onNewTemplate: () => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  currentTemplate,
  onSelectTemplate,
  onLoadSample,
  isAutoDetected,
  customTemplates,
  activeMode,
  onModeChange,
  onNewTemplate,
}) => {
  const isCustomActive = customTemplates.some((t) => t.id === currentTemplate);
  const activeCustom = customTemplates.find((t) => t.id === currentTemplate);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>University Template Engine</span>
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
              Calibrate & modify 3 target fields (Course Name, Study Period, Certificate Paragraph)
            </p>
          </div>
        </div>

        {/* Workspace Mode Switcher & Template Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fill & Generate vs Template Editor Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onModeChange("form")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                activeMode === "form"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Fill & Generate</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("editor")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                activeMode === "editor"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Template Editor</span>
            </button>
          </div>

          {/* Template Quick Switcher Chips */}
          <div className="flex items-center flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onSelectTemplate("hanyang")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1",
                currentTemplate === "hanyang"
                  ? "bg-zinc-800 text-white font-semibold ring-1 ring-zinc-600"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span>Hanyang Univ.</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTemplate("korea")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1",
                currentTemplate === "korea"
                  ? "bg-zinc-800 text-white font-semibold ring-1 ring-zinc-600"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span>Korea Univ.</span>
            </button>

            {/* Custom Saved Templates */}
            {customTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTemplate(t.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 max-w-[140px] truncate",
                  currentTemplate === t.id
                    ? "bg-zinc-800 text-indigo-300 font-semibold ring-1 ring-indigo-500"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
                title={t.name}
              >
                <span className="truncate">{t.name}</span>
              </button>
            ))}

            {/* + New Template Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onNewTemplate}
              className="h-6 text-[11px] px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 gap-1"
              title="Create a new custom template"
            >
              <Plus className="w-3 h-3" />
              <span>New Template</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Template Info & Quick Test Samples */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-zinc-400 flex items-center gap-2">
          {currentTemplate === "hanyang" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Hanyang University</strong>: Confirmation of Acceptance (Applying Course, Education Period, English Certificate).
              </span>
            </>
          ) : currentTemplate === "korea" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Korea University</strong>: Letter of Acceptance (Course Name, Study Period, English Certificate).
              </span>
            </>
          ) : isCustomActive && activeCustom ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Custom Template</strong>: {activeCustom.name} (3 Calibrated Fields).
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-rose-300">
                Uploaded document does not match a preset. Open Template Editor to map its 3 fields!
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
            Hanyang Sample
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 border-zinc-700 hover:border-indigo-500 text-zinc-300"
            onClick={() => onLoadSample("/samples/sample-input.pdf", "k.t. input.pdf")}
          >
            Korea Univ Sample
          </Button>
        </div>
      </div>
    </div>
  );
};
