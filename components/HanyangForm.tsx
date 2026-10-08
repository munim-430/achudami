"use client";

import React from "react";
import {
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Calendar,
  FileCheck2,
  Info,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { HanyangTemplateValues } from "@/lib/templates/hanyang";
import { ValidationResult } from "@/lib/pdf/validation";

interface HanyangFormProps {
  values: HanyangTemplateValues;
  onValuesChange: (newValues: HanyangTemplateValues) => void;
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasPdfLoaded: boolean;
  hasGeneratedOutput: boolean;
  validationResult: ValidationResult | null;
  isFontMissing?: boolean;
}

export const HanyangForm: React.FC<HanyangFormProps> = ({
  values,
  onValuesChange,
  onGenerate,
  onDownload,
  isGenerating,
  hasPdfLoaded,
  hasGeneratedOutput,
  validationResult,
  isFontMissing = false,
}) => {
  const handleFieldChange = (field: keyof HanyangTemplateValues, val: string) => {
    onValuesChange({
      ...values,
      [field]: val,
    });
  };

  const isDownloadBlocked =
    !hasGeneratedOutput ||
    isFontMissing ||
    (validationResult !== null && !validationResult.valid);

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-2xl flex flex-col h-full">
      <CardHeader className="py-4 px-5 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>Hanyang University Editable Fields</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Automatic font size, line height, and word spacing matching via Times New Roman TTF
            </CardDescription>
          </div>
          <Badge variant="default" className="text-[11px] font-mono px-2.5 py-0.5">
            HANYANG COA
          </Badge>
        </div>

        {/* Locked Fields Guarantee Card */}
        <div className="mt-3 p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Locked Fields Preserved (Zero Modifications)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Student ID No., Applicant’s Name, Date of Birth, Korean certification text, date, and
            official signatory are 100% untouched.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* FIELD 1: Applying Course */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="hanyang-course"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Applying Course (지원과정)</span>
              <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-800/60">
                Multiline
              </Badge>
            </Label>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Covers: &ldquo;Korean Language Course&rdquo; → Redraws multiline course
          </div>
          <Textarea
            id="hanyang-course"
            rows={2}
            value={values.applyingCourse}
            onChange={(e) => handleFieldChange("applyingCourse", e.target.value)}
            placeholder="Applying Course (supports multiline)..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-serif leading-relaxed"
          />
        </div>

        {/* FIELD 2: Education Period */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="hanyang-period"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Education Period (교육기간)</span>
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-800/60">
                YYYY.MM.DD.-YYYY.MM.DD
              </Badge>
            </Label>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Covers: &ldquo;2026.12.02.-2027.02.12&rdquo; → Keeps label untouched
          </div>
          <Input
            id="hanyang-period"
            value={values.educationPeriod}
            onChange={(e) => handleFieldChange("educationPeriod", e.target.value)}
            placeholder="e.g. 2026.12.02.-2032.09.01"
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-mono"
          />
        </div>

        {/* FIELD 3: English Certificate Text */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 transition-all hover:border-zinc-700/80">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="hanyang-cert"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 inline-flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>English Certificate Text</span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/60">
                Word-Wrapped
              </Badge>
            </Label>
          </div>
          <div className="text-[11px] text-zinc-400 italic">
            Replaces broken input spacing with clean Times New Roman paragraph
          </div>
          <Textarea
            id="hanyang-cert"
            rows={5}
            value={values.englishCertText}
            onChange={(e) => handleFieldChange("englishCertText", e.target.value)}
            placeholder="Clean English certificate text..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 font-serif leading-relaxed"
          />
        </div>

        {/* PRE-DOWNLOAD VALIDATION STATUS CHECKLIST */}
        {validationResult && (
          <div
            className={`p-3.5 rounded-xl border ${
              validationResult.valid
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                : "bg-rose-950/40 border-rose-800/80 text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {validationResult.valid
                    ? "Pre-Download Verification Passed (11/11 Checks)"
                    : "Pre-Download Verification Warning"}
                </span>
              </span>
              <Badge
                variant={validationResult.valid ? "success" : "destructive"}
                className="text-[10px]"
              >
                {validationResult.valid ? "VERIFIED" : "BLOCKED"}
              </Badge>
            </div>

            <div className="space-y-1 text-[11px]">
              {validationResult.checks.map((chk) => (
                <div key={chk.id} className="flex items-center justify-between">
                  <span className="opacity-90">{chk.name}</span>
                  <span className={chk.passed ? "text-emerald-400" : "text-rose-400 font-medium"}>
                    {chk.passed ? "✓ Passed" : "✗ Failed"}
                  </span>
                </div>
              ))}
            </div>

            {validationResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-800/50 text-[11px] text-rose-300">
                {validationResult.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FONT MISSING SCREEN WARNING */}
        {isFontMissing && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Times New Roman Font Missing</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Generation is blocked. Non-negotiable rule: Times New Roman TTF must be present in
              /public/fonts/TimesNewRoman.ttf. Substitute fonts are disabled.
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="pt-2 space-y-2.5">
          <Button
            size="lg"
            variant="default"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2"
            disabled={!hasPdfLoaded || isGenerating || isFontMissing}
            onClick={onGenerate}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Processing Hanyang Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Generate & Preview Hanyang Output</span>
              </>
            )}
          </Button>

          <Button
            size="default"
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            disabled={isDownloadBlocked}
            onClick={onDownload}
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download HANYANG output.pdf</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
