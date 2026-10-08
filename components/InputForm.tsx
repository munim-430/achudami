"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Download,
  RotateCcw,
  Bug,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  GraduationCap,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { FieldBoundingBox, FieldValues } from "@/lib/types";
import { roundToPrecision } from "@/lib/coordinateUtils";
import {
  KU_ACCEPTANCE_LETTER_PRESET,
  KU_FIRST_PARAGRAPH_PRESET,
} from "@/lib/presets";
import { cn } from "@/lib/utils";

interface InputFormProps {
  boxes: FieldBoundingBox[];
  values: FieldValues;
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;
  onValuesChange: (newValues: FieldValues) => void;
  onBoxChange: (updatedBox: FieldBoundingBox) => void;
  onResetToPreset: () => void;
  onSelectPreset: (presetId: string) => void;
  onGenerateAndDownload: () => void;
  isGenerating: boolean;
  hasPdfLoaded: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  boxes,
  values,
  debugMode,
  onDebugModeChange,
  onValuesChange,
  onBoxChange,
  onResetToPreset,
  onSelectPreset,
  onGenerateAndDownload,
  isGenerating,
  hasPdfLoaded,
}) => {
  const [showCoordinateSettings, setShowCoordinateSettings] = useState<boolean>(false);
  const [activeSettingsField, setActiveSettingsField] = useState<string>("course");

  const handleTextChange = (key: string, val: string) => {
    onValuesChange({
      ...values,
      [key]: val,
    });
  };

  const getBox = (key: string) => boxes.find((b) => b.key === key);

  const nudgeCoordinate = (
    box: FieldBoundingBox,
    axis: "x" | "y" | "width" | "height" | "fontSize",
    delta: number
  ) => {
    onBoxChange({
      ...box,
      [axis]: roundToPrecision(Math.max(0, ((box[axis] as number) ?? 0) + delta), 2),
    });
  };

  const courseBox = getBox("course");
  const studyPeriodBox = getBox("studyPeriod");
  const certTextBox = getBox("certText");

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-2xl flex flex-col h-full">
      <CardHeader className="py-4 px-5 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>Korea University Target Fields</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Strict Whiteout and Redraw on Course, Study Period, & English Certificate
            </CardDescription>
          </div>
          <Badge
            variant={debugMode ? "destructive" : "default"}
            className="text-[11px] font-mono px-2.5 py-0.5"
          >
            {debugMode ? "DEBUG ACTIVE" : "PRODUCTION"}
          </Badge>
        </div>

        {/* Debug Toggle Bar */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
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
                Draws red borders on original PDF to verify coordinate alignment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={debugMode}
              onCheckedChange={onDebugModeChange}
              aria-label="Toggle Debug Mode"
            />
          </div>
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
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Course Name</span>
            </Label>
            <span className="text-[10px] text-zinc-400 font-mono">
              [X: {courseBox?.x.toFixed(1)}pt, Y: {courseBox?.y.toFixed(1)}pt]
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Covers: &ldquo;Korea University Korean Language Education Program&rdquo;
          </div>
          <Input
            id="field-course"
            value={values.course ?? ""}
            onChange={(e) => handleTextChange("course", e.target.value)}
            placeholder="Course Name..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-sm focus:border-indigo-500"
          />
        </div>

        {/* FIELD 2: Study Period */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="field-study-period"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Study Period</span>
            </Label>
            <span className="text-[10px] text-zinc-400 font-mono">
              [X: {studyPeriodBox?.x.toFixed(1)}pt, Y: {studyPeriodBox?.y.toFixed(1)}pt]
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Covers: &ldquo;DEC.2026 – NOV.2027&rdquo;
          </div>
          <Input
            id="field-study-period"
            value={values.studyPeriod ?? ""}
            onChange={(e) => handleTextChange("studyPeriod", e.target.value)}
            placeholder="e.g. DEC.2026 – SEP.2032"
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-sm focus:border-indigo-500"
          />
        </div>

        {/* FIELD 3: English Certificate Text */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="field-cert-text"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>English Certificate Text</span>
              <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-800/60">
                Multiline Wrapped
              </Badge>
            </Label>
            <span className="text-[10px] text-zinc-400 font-mono">
              [X: {certTextBox?.x.toFixed(1)}pt, Y: {certTextBox?.y.toFixed(1)}pt]
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Covers: &ldquo;This is to certify that students who complete...&rdquo;
          </div>
          <Textarea
            id="field-cert-text"
            rows={5}
            value={values.certText ?? ""}
            onChange={(e) => handleTextChange("certText", e.target.value)}
            placeholder="Full certificate replacement paragraph..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs leading-relaxed focus:border-indigo-500 font-serif"
          />
        </div>

        {/* FINE-TUNE COORDINATES SECTION (Accessible anytime or in debug mode) */}
        <div className="pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setShowCoordinateSettings(!showCoordinateSettings)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950/40 rounded-lg border border-zinc-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fine-Tune Target Coordinates (PDF Points)</span>
            </span>
            {showCoordinateSettings ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {showCoordinateSettings && (
            <div className="mt-3 p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs text-zinc-400">Target Field:</span>
                <div className="flex gap-1">
                  {(["course", "studyPeriod", "certText"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSettingsField(key)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] rounded-md transition-colors",
                        activeSettingsField === key
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      {key === "course"
                        ? "Course"
                        : key === "studyPeriod"
                        ? "Period"
                        : "Certificate"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Box Coordinates Editor */}
              {(() => {
                const curBox = getBox(activeSettingsField);
                if (!curBox) return null;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <Label className="text-[11px] text-zinc-400">X (Points from left)</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "x", -1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={curBox.x}
                            onChange={(e) =>
                              onBoxChange({ ...curBox, x: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs px-2 text-center bg-zinc-900 border-zinc-700"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "x", 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] text-zinc-400">Y (Points from bottom)</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "y", -1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={curBox.y}
                            onChange={(e) =>
                              onBoxChange({ ...curBox, y: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs px-2 text-center bg-zinc-900 border-zinc-700"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "y", 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] text-zinc-400">Width (Points)</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "width", -1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            step="1"
                            value={curBox.width}
                            onChange={(e) =>
                              onBoxChange({ ...curBox, width: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs px-2 text-center bg-zinc-900 border-zinc-700"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "width", 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] text-zinc-400">Height (Points)</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "height", -1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            step="1"
                            value={curBox.height}
                            onChange={(e) =>
                              onBoxChange({ ...curBox, height: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs px-2 text-center bg-zinc-900 border-zinc-700"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => nudgeCoordinate(curBox, "height", 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Label className="text-[11px] text-zinc-400">Font Size (pt)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.5"
                          min="6"
                          max="24"
                          value={curBox.fontSize}
                          onChange={(e) =>
                            onBoxChange({
                              ...curBox,
                              fontSize: parseFloat(e.target.value) || 10.5,
                            })
                          }
                          className="h-7 w-16 text-xs text-center bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-[10px] text-zinc-400">pt</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Reset to Default Preset */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                  onClick={onResetToPreset}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset to Defaults
                </Button>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] text-zinc-400"
                    onClick={() => onSelectPreset(KU_FIRST_PARAGRAPH_PRESET.id)}
                  >
                    1st Para Preset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] text-indigo-400"
                    onClick={() => onSelectPreset(KU_ACCEPTANCE_LETTER_PRESET.id)}
                  >
                    2nd Para Preset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAFEGUARD NOTE */}
        <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Untouched Fields Protected</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Name (<span className="text-zinc-300">PROMI MUMTAHINA</span>), Date of Birth (
            <span className="text-zinc-300">12-18-2005</span>), and Document ID (
            <span className="text-zinc-300">KU KLC-2026-10-06-005</span>) remain completely untouched.
          </p>
        </div>

        {/* PRIMARY GENERATE & DOWNLOAD BUTTON */}
        <div className="pt-2">
          <Button
            size="lg"
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            disabled={!hasPdfLoaded || isGenerating}
            onClick={onGenerateAndDownload}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Processing Pixel-Perfect PDF...</span>
              </>
            ) : debugMode ? (
              <>
                <Bug className="w-4 h-4 text-white" />
                <span>Download Debug PDF (output.pdf)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Generate & Download output.pdf</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
