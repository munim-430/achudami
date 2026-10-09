"use client";

import React from "react";
import {
  Sparkles,
  Download,
  Sliders,
  Bug,
  FileCheck2,
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { CalibrationPreset, FieldValues } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CustomTemplateFormProps {
  template: CalibrationPreset;
  values: FieldValues;
  onValuesChange: (newValues: FieldValues) => void;
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
  onGenerate: () => void;
  onDownload: () => void;
  onSwitchToEditor: () => void;
  isGenerating: boolean;
  hasPdfLoaded: boolean;
  hasGeneratedOutput: boolean;
}

export const CustomTemplateForm: React.FC<CustomTemplateFormProps> = ({
  template,
  values,
  onValuesChange,
  debugMode,
  onDebugModeChange,
  onGenerate,
  onDownload,
  onSwitchToEditor,
  isGenerating,
  hasPdfLoaded,
  hasGeneratedOutput,
}) => {
  const handleFieldChange = (key: string, val: string) => {
    onValuesChange({
      ...values,
      [key]: val,
    });
  };

  const courseBox = template.boxes.find((b) => b.key === "course");
  const studyPeriodBox = template.boxes.find((b) => b.key === "studyPeriod");
  const certTextBox = template.boxes.find((b) => b.key === "certText");

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-2xl flex flex-col h-full">
      <CardHeader className="py-4 px-5 border-b border-zinc-800/80">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>{template.name}</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Modify the 3 calibrated fields with Times New Roman TrueType typography
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onSwitchToEditor}
            className="h-7 text-xs gap-1.5 border-zinc-700 hover:border-indigo-500 text-zinc-200"
            title="Edit bounding boxes and coordinates for this template"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Template</span>
          </Button>
        </div>

        {/* Debug Toggle Bar */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Bug
              className={cn(
                "w-4 h-4 transition-colors",
                debugMode ? "text-rose-400" : "text-zinc-500"
              )}
            />
            <div>
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>Debug Mode</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  (Overlay Red Borders)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Draws red boundary boxes on PDF to verify placement
              </p>
            </div>
          </div>
          <Switch
            checked={debugMode}
            onCheckedChange={onDebugModeChange}
            aria-label="Toggle Debug Mode"
          />
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* FIELD 1: Course Name */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="field-course"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-blue-950/80 border border-blue-700 text-blue-300 inline-flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Course Name (지원과정)</span>
              {courseBox?.multiline && (
                <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-800/60">
                  Multiline
                </Badge>
              )}
            </Label>
            {courseBox && (
              <span className="text-[10px] text-zinc-400 font-mono">
                [X: {courseBox.x.toFixed(1)}pt, Y: {courseBox.y.toFixed(1)}pt]
              </span>
            )}
          </div>
          {courseBox?.multiline ? (
            <Textarea
              id="field-course"
              rows={2}
              value={values.course ?? ""}
              onChange={(e) => handleFieldChange("course", e.target.value)}
              placeholder="e.g. Korean Language Course / Bachelor of Business Administration"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-serif leading-relaxed"
            />
          ) : (
            <Input
              id="field-course"
              value={values.course ?? ""}
              onChange={(e) => handleFieldChange("course", e.target.value)}
              placeholder="e.g. Korea University Korean Language Education Program"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-serif"
            />
          )}
        </div>

        {/* FIELD 2: Study Period */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="field-study-period"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 inline-flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Study Period (교육기간)</span>
            </Label>
            {studyPeriodBox && (
              <span className="text-[10px] text-zinc-400 font-mono">
                [X: {studyPeriodBox.x.toFixed(1)}pt, Y: {studyPeriodBox.y.toFixed(1)}pt]
              </span>
            )}
          </div>
          <Input
            id="field-study-period"
            value={values.studyPeriod ?? ""}
            onChange={(e) => handleFieldChange("studyPeriod", e.target.value)}
            placeholder="e.g. DEC.2026 – SEP.2032 or 2026.12.02.-2032.09.01"
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-mono"
          />
        </div>

        {/* FIELD 3: English Certificate Paragraph */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="field-cert-text"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 inline-flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>Certificate Paragraph</span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/60">
                Word-Wrapped
              </Badge>
            </Label>
            {certTextBox && (
              <span className="text-[10px] text-zinc-400 font-mono">
                [X: {certTextBox.x.toFixed(1)}pt, Y: {certTextBox.y.toFixed(1)}pt]
              </span>
            )}
          </div>
          <Textarea
            id="field-cert-text"
            rows={5}
            value={values.certText ?? ""}
            onChange={(e) => handleFieldChange("certText", e.target.value)}
            placeholder="Official English acceptance paragraph text..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-serif leading-relaxed"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg text-xs h-10 gap-2"
            onClick={onGenerate}
            disabled={!hasPdfLoaded || isGenerating}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGenerating ? "Processing PDF..." : "Generate Modified PDF"}</span>
          </Button>

          {hasGeneratedOutput && (
            <Button
              type="button"
              variant="outline"
              onClick={onDownload}
              className="border-emerald-600/70 text-emerald-300 hover:bg-emerald-950/60 text-xs h-10 gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download PDF</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
