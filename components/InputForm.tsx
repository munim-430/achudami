"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  SlidersHorizontal,
  RotateCcw,
  Download,
  Upload,
  Check,
  Type,
  Maximize2,
  Calendar,
  GraduationCap,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { FieldBoundingBox, FieldValues, StandardFontName, TextAlignment } from "@/lib/types";
import { roundToPrecision } from "@/lib/coordinateUtils";
import { KU_ACCEPTANCE_LETTER_PRESET } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface InputFormProps {
  boxes: FieldBoundingBox[];
  values: FieldValues;
  activeFieldKey: string;
  onActiveFieldChange: (key: string) => void;
  onValuesChange: (newValues: FieldValues) => void;
  onBoxChange: (updatedBox: FieldBoundingBox) => void;
  onResetToPreset: () => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasPdfLoaded: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  boxes,
  values,
  activeFieldKey,
  onActiveFieldChange,
  onValuesChange,
  onBoxChange,
  onResetToPreset,
  onExportConfig,
  onImportConfig,
  onGenerate,
  isGenerating,
  hasPdfLoaded,
}) => {
  const [expandedSettingsKey, setExpandedSettingsKey] = useState<string | null>(null);

  const handleTextChange = (key: string, val: string) => {
    onValuesChange({
      ...values,
      [key]: val,
    });
  };

  const getBox = (key: string) => boxes.find((b) => b.key === key);

  const toggleSettings = (key: string) => {
    setExpandedSettingsKey(expandedSettingsKey === key ? null : key);
  };

  // Nudge coordinate by delta points
  const nudgeCoordinate = (
    box: FieldBoundingBox,
    axis: "x" | "y" | "width" | "height",
    delta: number
  ) => {
    onBoxChange({
      ...box,
      [axis]: roundToPrecision(Math.max(0, (box[axis] ?? 0) + delta), 2),
    });
  };

  const courseBox = getBox("course");
  const studyPeriodBox = getBox("studyPeriod");
  const certTextBox = getBox("certText");

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl flex flex-col h-full">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
              <span>Text Replacement Fields</span>
              <Badge variant="default" className="text-[10px]">
                Pixel-Perfect Redraw
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Provide new text values to white-out original PDF streams and redraw with matched typography.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetToPreset}
            title="Reset fields & coordinates to default Korea University Acceptance Letter preset"
            className="text-xs h-7 gap-1 border-slate-700 text-slate-300 hover:text-white"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Reset Preset</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 py-4 flex-1 overflow-y-auto">
        {/* Field 1: Course Name */}
        <div
          onClick={() => onActiveFieldChange("course")}
          className={cn(
            "p-3.5 rounded-xl border transition-all space-y-2.5",
            activeFieldKey === "course"
              ? "border-blue-500/80 bg-blue-950/20 ring-1 ring-blue-500/40"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="field-course" className="text-blue-400">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>1. Course Name</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                {courseBox ? `${courseBox.width} × ${courseBox.height} pt` : ""}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSettings("course");
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
                title="Fine-tune position & font"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Input
            id="field-course"
            value={values.course ?? ""}
            onChange={(e) => handleTextChange("course", e.target.value)}
            placeholder="e.g. Korea University Korean Language Education..."
            className="text-sm font-medium border-slate-700 bg-slate-950/60"
          />

          {/* Collapsible Fine-Tuning Drawer */}
          {expandedSettingsKey === "course" && courseBox && (
            <FieldDetailControls
              box={courseBox}
              onBoxChange={onBoxChange}
              onNudge={(axis, delta) => nudgeCoordinate(courseBox, axis, delta)}
            />
          )}
        </div>

        {/* Field 2: Study Period */}
        <div
          onClick={() => onActiveFieldChange("studyPeriod")}
          className={cn(
            "p-3.5 rounded-xl border transition-all space-y-2.5",
            activeFieldKey === "studyPeriod"
              ? "border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-500/40"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="field-study-period" className="text-amber-400">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>2. Study Period</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                {studyPeriodBox ? `${studyPeriodBox.width} × ${studyPeriodBox.height} pt` : ""}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSettings("studyPeriod");
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
                title="Fine-tune position & font"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Input
            id="field-study-period"
            value={values.studyPeriod ?? ""}
            onChange={(e) => handleTextChange("studyPeriod", e.target.value)}
            placeholder="e.g. DEC.2026 – SEP.2032"
            className="text-sm font-medium border-slate-700 bg-slate-950/60"
          />

          {expandedSettingsKey === "studyPeriod" && studyPeriodBox && (
            <FieldDetailControls
              box={studyPeriodBox}
              onBoxChange={onBoxChange}
              onNudge={(axis, delta) => nudgeCoordinate(studyPeriodBox, axis, delta)}
            />
          )}
        </div>

        {/* Field 3: English Certificate Text */}
        <div
          onClick={() => onActiveFieldChange("certText")}
          className={cn(
            "p-3.5 rounded-xl border transition-all space-y-2.5",
            activeFieldKey === "certText"
              ? "border-emerald-500/80 bg-emerald-950/20 ring-1 ring-emerald-500/40"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="field-cert-text" className="text-emerald-400">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>3. English Certificate Text (Multi-Line Auto-Wrap)</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                {certTextBox ? `${certTextBox.width} × ${certTextBox.height} pt` : ""}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSettings("certText");
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
                title="Fine-tune position & font"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Textarea
            id="field-cert-text"
            rows={5}
            value={values.certText ?? ""}
            onChange={(e) => handleTextChange("certText", e.target.value)}
            placeholder="Enter certificate verification paragraph. Automatically wraps to bounding box width..."
            className="text-xs leading-relaxed border-slate-700 bg-slate-950/60 font-sans"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Length: {values.certText?.length ?? 0} characters (~
              {Math.ceil((values.certText?.length ?? 0) / 70)} lines)
            </span>
            <span className="text-emerald-400/80">Auto word-wrapped in PDF engine</span>
          </div>

          {expandedSettingsKey === "certText" && certTextBox && (
            <FieldDetailControls
              box={certTextBox}
              onBoxChange={onBoxChange}
              onNudge={(axis, delta) => nudgeCoordinate(certTextBox, axis, delta)}
            />
          )}
        </div>

        {/* Configuration import/export action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px]">Calibration Config:</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onExportConfig}
              className="text-[11px] h-7 px-2 text-slate-400 hover:text-slate-200"
            >
              <Download className="w-3 h-3 mr-1" />
              Export JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onImportConfig}
              className="text-[11px] h-7 px-2 text-slate-400 hover:text-slate-200"
            >
              <Upload className="w-3 h-3 mr-1" />
              Import JSON
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Footer Generate CTA */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={!hasPdfLoaded || isGenerating}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25 shadow-lg text-white font-semibold h-11 transition-all duration-200"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Applying White-out & Redraw...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Generate & Preview Modified PDF</span>
            </span>
          )}
        </Button>
        {!hasPdfLoaded && (
          <p className="text-[11px] text-center text-amber-400/80">
            Upload a PDF or load the sample template to enable generation.
          </p>
        )}
      </div>
    </Card>
  );
};

interface FieldDetailControlsProps {
  box: FieldBoundingBox;
  onBoxChange: (box: FieldBoundingBox) => void;
  onNudge: (axis: "x" | "y" | "width" | "height", delta: number) => void;
}

const FieldDetailControls: React.FC<FieldDetailControlsProps> = ({
  box,
  onBoxChange,
  onNudge,
}) => {
  return (
    <div className="pt-3 border-t border-slate-800/80 space-y-3 bg-slate-950/70 p-3 rounded-lg text-xs">
      <div className="flex items-center justify-between text-slate-300 font-medium">
        <span>Typography & Bounding Box Coordinates</span>
        <Badge variant="secondary" className="text-[10px] font-mono">
          Page {box.pageNumber}
        </Badge>
      </div>

      {/* Font Family & Size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] text-slate-400 mb-1">Font Family</Label>
          <select
            value={box.fontFamily}
            onChange={(e) =>
              onBoxChange({
                ...box,
                fontFamily: e.target.value as StandardFontName,
              })
            }
            className="w-full h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="TimesRoman">Times Roman (Serif - Cert Style)</option>
            <option value="TimesRomanBold">Times Roman Bold</option>
            <option value="NotoSerif">Noto Serif (Bundled TTF)</option>
            <option value="Helvetica">Helvetica (Sans-Serif)</option>
            <option value="HelveticaBold">Helvetica Bold</option>
            <option value="DejaVuSans">DejaVu Sans (Bundled TTF)</option>
            <option value="Courier">Courier (Monospace)</option>
            <option value="custom">Custom Uploaded Font</option>
          </select>
        </div>

        <div>
          <Label className="text-[11px] text-slate-400 mb-1">Font Size (pt)</Label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step="0.1"
              value={box.fontSize}
              onChange={(e) =>
                onBoxChange({
                  ...box,
                  fontSize: parseFloat(e.target.value) || 10,
                })
              }
              className="h-8 text-xs font-mono"
            />
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() =>
                  onBoxChange({ ...box, fontSize: roundToPrecision(box.fontSize - 0.5, 1) })
                }
                className="w-6 h-8 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() =>
                  onBoxChange({ ...box, fontSize: roundToPrecision(box.fontSize + 0.5, 1) })
                }
                className="w-6 h-8 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alignment & Line Spacing */}
      <div className="grid grid-cols-2 gap-3 items-center">
        <div>
          <Label className="text-[11px] text-slate-400 mb-1">Text Alignment</Label>
          <div className="flex rounded-md border border-slate-700 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => onBoxChange({ ...box, alignment: "left" })}
              className={cn(
                "flex-1 py-1 rounded text-center transition flex justify-center items-center",
                box.alignment === "left"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onBoxChange({ ...box, alignment: "center" })}
              className={cn(
                "flex-1 py-1 rounded text-center transition flex justify-center items-center",
                box.alignment === "center"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onBoxChange({ ...box, alignment: "right" })}
              className={cn(
                "flex-1 py-1 rounded text-center transition flex justify-center items-center",
                box.alignment === "right"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {box.multiline && (
          <div>
            <Label className="text-[11px] text-slate-400 mb-1">Line Height (pt)</Label>
            <Input
              type="number"
              step="0.5"
              value={box.lineHeight ?? roundToPrecision(box.fontSize * 1.35, 1)}
              onChange={(e) =>
                onBoxChange({
                  ...box,
                  lineHeight: parseFloat(e.target.value) || 14,
                })
              }
              className="h-8 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Coordinate Nudging & Precision Values */}
      <div>
        <Label className="text-[11px] text-slate-400 mb-1">
          PDF Coordinates (origin bottom-left, pt)
        </Label>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
          <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center">
            <span className="text-slate-500 block text-[9px]">X (Left)</span>
            <span className="text-slate-200">{box.x}</span>
            <div className="flex justify-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => onNudge("x", -0.5)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onNudge("x", 0.5)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center">
            <span className="text-slate-500 block text-[9px]">Y (Bottom)</span>
            <span className="text-slate-200">{box.y}</span>
            <div className="flex justify-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => onNudge("y", -0.5)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onNudge("y", 0.5)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center">
            <span className="text-slate-500 block text-[9px]">Width</span>
            <span className="text-slate-200">{box.width}</span>
            <div className="flex justify-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => onNudge("width", -1)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onNudge("width", 1)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-center">
            <span className="text-slate-500 block text-[9px]">Height</span>
            <span className="text-slate-200">{box.height}</span>
            <div className="flex justify-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => onNudge("height", -1)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onNudge("height", 1)}
                className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
