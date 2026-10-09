"use client";

import React, { useState, useRef } from "react";
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  FileCode,
  Tag,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Maximize2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Badge } from "./ui/Badge";
import { Switch } from "./ui/Switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { BoundingBoxDrawer } from "./BoundingBoxDrawer";
import { CalibrationPreset, FieldBoundingBox, TextAlignment } from "@/lib/types";
import { roundToPrecision } from "@/lib/coordinateUtils";
import { cn } from "@/lib/utils";

interface TemplateEditorProps {
  template: CalibrationPreset;
  pdfBytes: Uint8Array | null;
  onSaveTemplate: (updatedTemplate: CalibrationPreset) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onExportJson: (template: CalibrationPreset) => void;
  onImportJson: (imported: CalibrationPreset) => void;
  onResetTemplate: () => void;
  onTestGenerate: () => void;
  isGenerating?: boolean;
}

const FIELD_CONFIGS = [
  {
    key: "course",
    num: 1,
    name: "Course Name",
    subtext: "지원과정 (Applying Course)",
    badgeColor: "bg-blue-900/60 text-blue-300 border-blue-700/80",
    dotColor: "#3b82f6",
  },
  {
    key: "studyPeriod",
    num: 2,
    name: "Study Period",
    subtext: "교육기간 (Education Period)",
    badgeColor: "bg-amber-900/60 text-amber-300 border-amber-700/80",
    dotColor: "#f59e0b",
  },
  {
    key: "certText",
    num: 3,
    name: "Certificate Paragraph",
    subtext: "English Acceptance Paragraph",
    badgeColor: "bg-emerald-900/60 text-emerald-300 border-emerald-700/80",
    dotColor: "#10b981",
  },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  pdfBytes,
  onSaveTemplate,
  onDeleteTemplate,
  onExportJson,
  onImportJson,
  onResetTemplate,
  onTestGenerate,
  isGenerating = false,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<CalibrationPreset>(template);
  const [activeFieldKey, setActiveFieldKey] = useState<string>("course");
  const [isCalibrating, setIsCalibrating] = useState<boolean>(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when template prop updates
  React.useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  const activeBox =
    currentTemplate.boxes.find((b) => b.key === activeFieldKey) || currentTemplate.boxes[0];

  const updateActiveBox = (updated: Partial<FieldBoundingBox>) => {
    if (!activeBox) return;
    const newBox: FieldBoundingBox = {
      ...activeBox,
      ...updated,
    };
    const newBoxes = currentTemplate.boxes.map((b) => (b.key === activeBox.key ? newBox : b));
    const updatedTemplate = {
      ...currentTemplate,
      boxes: newBoxes,
    };
    setCurrentTemplate(updatedTemplate);
  };

  const nudge = (
    axis: "x" | "y" | "width" | "height" | "fontSize" | "lineHeight",
    delta: number
  ) => {
    if (!activeBox) return;
    const currentVal = (activeBox[axis] as number) ?? 0;
    const nextVal = roundToPrecision(Math.max(0, currentVal + delta), 2);
    updateActiveBox({ [axis]: nextVal });
  };

  const handleBoxChangeFromCanvas = (newBox: FieldBoundingBox) => {
    const newBoxes = currentTemplate.boxes.map((b) => (b.key === newBox.key ? newBox : b));
    setCurrentTemplate((prev) => ({
      ...prev,
      boxes: newBoxes,
    }));
  };

  const handleSave = () => {
    onSaveTemplate(currentTemplate);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const imported = parsed.template || parsed;
        if (imported && Array.isArray(imported.boxes)) {
          onImportJson(imported);
          setCurrentTemplate(imported);
        }
      } catch (err) {
        console.error("Failed to parse imported JSON template:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleMarkersChange = (raw: string) => {
    const markers = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setCurrentTemplate((prev) => ({
      ...prev,
      textMarkers: markers,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Template Toolbar Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <span>Template Editor:</span>
              <Input
                value={currentTemplate.name}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-8 max-w-sm text-sm font-semibold bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-indigo-500"
                placeholder="Template Name..."
              />
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Calibrate bounding boxes and layout parameters for the 3 target fields on this document.
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {saveSuccessNotice && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </span>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExportJson(currentTemplate)}
            className="h-8 text-xs border-zinc-700 hover:border-zinc-500 text-zinc-300 gap-1.5"
            title="Export as .json template file"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export JSON</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs border-zinc-700 hover:border-zinc-500 text-zinc-300 gap-1.5"
            title="Import a saved template from .json"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import JSON</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            className="hidden"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onResetTemplate}
            className="h-8 text-xs border-zinc-800 hover:bg-zinc-800 text-zinc-400 gap-1"
            title="Reset bounding boxes to default layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>

          {!currentTemplate.isBuiltIn && onDeleteTemplate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteTemplate(currentTemplate.id)}
              className="h-8 text-xs border-rose-900/60 text-rose-400 hover:bg-rose-950/50 gap-1"
              title="Delete this custom template"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={onTestGenerate}
            disabled={!pdfBytes || isGenerating}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Testing..." : "Test Generation"}</span>
          </Button>
        </div>
      </div>

      {/* Main Split Grid: Left Sidebar Inspector & Right Interactive Canvas */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px] items-start">
        {/* LEFT COLUMN: Field Inspector Controls */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-md">
            <CardHeader className="py-4 px-5 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Select Target Field to Calibrate</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-zinc-400 font-mono">
                  3 Target Fields
                </Badge>
              </div>

              {/* 3 Fields Tab Switcher */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {FIELD_CONFIGS.map((f) => {
                  const isActive = f.key === activeFieldKey;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFieldKey(f.key)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1",
                        isActive
                          ? "bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md"
                          : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: f.dotColor }}
                        />
                        <span className="text-[10px] font-mono opacity-60">Field {f.num}</span>
                      </div>
                      <div className="font-semibold text-xs text-zinc-100 truncate w-full">
                        {f.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 overflow-y-auto max-h-[720px]">
              {activeBox && (
                <>
                  {/* Active Field Header */}
                  <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              FIELD_CONFIGS.find((f) => f.key === activeBox.key)?.dotColor ||
                              "#6366f1",
                          }}
                        />
                        <span>{activeBox.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        key: {activeBox.key} • Page {activeBox.pageNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {activeBox.width} × {activeBox.height} pt
                      </span>
                    </div>
                  </div>

                  {/* 1. COORDINATE CONTROLS (X, Y, Width, Height) */}
                  <div className="space-y-3 p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800/70">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Coordinates & Dimensions (PDF Points)</span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        Origin: Bottom-Left
                      </span>
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      {/* X Coordinate */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <Label className="text-[11px]">X Position</Label>
                          <span className="font-mono text-indigo-300 font-bold">{activeBox.x}pt</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("x", -5)}
                            title="-5pt"
                          >
                            -5
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("x", -1)}
                            title="-1pt"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={activeBox.x}
                            onChange={(e) =>
                              updateActiveBox({ x: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("x", 1)}
                            title="+1pt"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("x", 5)}
                            title="+5pt"
                          >
                            +5
                          </Button>
                        </div>
                      </div>

                      {/* Y Coordinate */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <Label className="text-[11px]">Y Position</Label>
                          <span className="font-mono text-indigo-300 font-bold">{activeBox.y}pt</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("y", -5)}
                            title="-5pt"
                          >
                            -5
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("y", -1)}
                            title="-1pt"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={activeBox.y}
                            onChange={(e) =>
                              updateActiveBox({ y: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("y", 1)}
                            title="+1pt"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("y", 5)}
                            title="+5pt"
                          >
                            +5
                          </Button>
                        </div>
                      </div>

                      {/* Width */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <Label className="text-[11px]">Width</Label>
                          <span className="font-mono text-indigo-300 font-bold">{activeBox.width}pt</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("width", -5)}
                            title="-5pt"
                          >
                            -5
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("width", -1)}
                            title="-1pt"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={activeBox.width}
                            onChange={(e) =>
                              updateActiveBox({ width: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("width", 1)}
                            title="+1pt"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("width", 5)}
                            title="+5pt"
                          >
                            +5
                          </Button>
                        </div>
                      </div>

                      {/* Height */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <Label className="text-[11px]">Height</Label>
                          <span className="font-mono text-indigo-300 font-bold">{activeBox.height}pt</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("height", -5)}
                            title="-5pt"
                          >
                            -5
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("height", -1)}
                            title="-1pt"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={activeBox.height}
                            onChange={(e) =>
                              updateActiveBox({ height: parseFloat(e.target.value) || 0 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("height", 1)}
                            title="+1pt"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => nudge("height", 5)}
                            title="+5pt"
                          >
                            +5
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. TYPOGRAPHY CONTROLS */}
                  <div className="space-y-3 p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800/70">
                    <span className="text-xs font-semibold text-zinc-300">
                      Typography & Redraw Formatting
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Font Size */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400">Font Size (pt)</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300"
                            onClick={() => nudge("fontSize", -0.5)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.25"
                            value={activeBox.fontSize}
                            onChange={(e) =>
                              updateActiveBox({ fontSize: parseFloat(e.target.value) || 10.5 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300"
                            onClick={() => nudge("fontSize", 0.5)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Line Height */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400">Line Height (pt)</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300"
                            onClick={() => nudge("lineHeight", -0.5)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            step="0.5"
                            value={activeBox.lineHeight ?? 13.0}
                            onChange={(e) =>
                              updateActiveBox({ lineHeight: parseFloat(e.target.value) || 13.0 })
                            }
                            className="h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-800"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300"
                            onClick={() => nudge("lineHeight", 0.5)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Alignment & Multiline Toggle */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400">Text Alignment</Label>
                        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                          {(["left", "center", "right"] as TextAlignment[]).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateActiveBox({ alignment: align })}
                              className={cn(
                                "flex-1 py-1 rounded text-[11px] font-medium flex items-center justify-center transition",
                                activeBox.alignment === align
                                  ? "bg-indigo-600 text-white font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              {align === "left" && <AlignLeft className="w-3 h-3" />}
                              {align === "center" && <AlignCenter className="w-3 h-3" />}
                              {align === "right" && <AlignRight className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-400">Multiline Wrapping</Label>
                        <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 h-8">
                          <span className="text-[11px] text-zinc-300">Wrap Text</span>
                          <Switch
                            checked={activeBox.multiline}
                            onCheckedChange={(checked) => updateActiveBox({ multiline: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. DEFAULT TEXT FOR THIS FIELD */}
                  <div className="space-y-2 p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800/70">
                    <Label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Default Value for {activeBox.name}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Pre-filled on load</span>
                    </Label>
                    <Textarea
                      rows={activeBox.multiline ? 3 : 2}
                      value={currentTemplate.defaultValues[activeBox.key] || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setCurrentTemplate((prev) => ({
                          ...prev,
                          defaultValues: {
                            ...prev.defaultValues,
                            [activeBox.key]: nextVal,
                          },
                        }));
                      }}
                      placeholder={`Default ${activeBox.name} value...`}
                      className="bg-zinc-900 border-zinc-800 text-xs font-serif text-zinc-200 focus:border-indigo-500"
                    />
                  </div>

                  {/* 4. AUTO-DETECTION MARKERS */}
                  <div className="space-y-2 p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800/70">
                    <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Auto-Detection Text Markers (Optional)</span>
                    </Label>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      Comma-separated words in the PDF (e.g. university name, document title) used to
                      automatically recognize this template on upload.
                    </p>
                    <Input
                      value={(currentTemplate.textMarkers || []).join(", ")}
                      onChange={(e) => handleMarkersChange(e.target.value)}
                      placeholder="e.g. Kyungdong University, Certificate of Admission"
                      className="h-8 bg-zinc-900 border-zinc-800 text-xs text-zinc-200 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive PDF Canvas Drawer */}
        <div className="lg:col-span-7 flex flex-col h-[760px]">
          <BoundingBoxDrawer
            pdfBytes={pdfBytes}
            boxes={currentTemplate.boxes}
            activeFieldKey={activeFieldKey}
            onActiveFieldChange={setActiveFieldKey}
            onBoxChange={handleBoxChangeFromCanvas}
            isCalibrating={isCalibrating}
            onToggleCalibration={() => setIsCalibrating((prev) => !prev)}
            debugMode={false}
          />
        </div>
      </section>
    </div>
  );
};
