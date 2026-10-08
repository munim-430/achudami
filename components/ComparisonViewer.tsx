"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  Download,
  Columns,
  Repeat,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Sparkles,
  FileText,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

// Ensure worker is configured on client
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

interface ComparisonViewerProps {
  originalPdfBytes: Uint8Array | null;
  modifiedPdfBytes: Uint8Array | null;
  modifiedBlobUrl: string | null;
  fileName?: string;
  processingTimeMs?: number;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  originalPdfBytes,
  modifiedPdfBytes,
  modifiedBlobUrl,
  fileName = "document.pdf",
  processingTimeMs = 0,
}) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "toggle">("side-by-side");
  const [activeToggleTab, setActiveToggleTab] = useState<"modified" | "original">("modified");
  const [zoomScale, setZoomScale] = useState<number>(1.1);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const modifiedCanvasRef = useRef<HTMLCanvasElement>(null);
  const toggleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger celebration confetti on new generation
  useEffect(() => {
    if (modifiedPdfBytes && modifiedPdfBytes.length > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#6366f1", "#10b981", "#3b82f6"],
        });
      } catch {
        // Confetti optional
      }
    }
  }, [modifiedPdfBytes]);

  // Render a specific PDF byte array onto a target canvas
  const renderPdfToCanvas = useCallback(
    async (bytes: Uint8Array | null, canvas: HTMLCanvasElement | null) => {
      if (!bytes || !canvas) return;

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(bytes),
          cMapUrl: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: zoomScale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
      } catch (err) {
        console.error("Error rendering PDF canvas:", err);
      }
    },
    [zoomScale]
  );

  // Render canvases whenever viewMode, activeToggleTab, zoomScale, or bytes change
  useEffect(() => {
    if (viewMode === "side-by-side") {
      renderPdfToCanvas(originalPdfBytes, originalCanvasRef.current);
      renderPdfToCanvas(modifiedPdfBytes, modifiedCanvasRef.current);
    } else {
      const activeBytes = activeToggleTab === "modified" ? modifiedPdfBytes : originalPdfBytes;
      renderPdfToCanvas(activeBytes, toggleCanvasRef.current);
    }
  }, [
    viewMode,
    activeToggleTab,
    zoomScale,
    originalPdfBytes,
    modifiedPdfBytes,
    renderPdfToCanvas,
  ]);

  const handleDownload = () => {
    if (!modifiedBlobUrl) return;
    const cleanName = fileName.replace(/\.pdf$/i, "");
    const downloadName = `${cleanName}_modified_pixel_perfect.pdf`;

    const a = document.createElement("a");
    a.href = modifiedBlobUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!modifiedPdfBytes) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-800 bg-slate-950/60 rounded-2xl h-full space-y-3">
        <FileText className="w-12 h-12 text-slate-600 stroke-1" />
        <h4 className="text-sm font-semibold text-slate-300">Awaiting Generation</h4>
        <p className="text-xs text-slate-500 max-w-sm">
          Click <strong>Generate & Preview Modified PDF</strong> on the left to process the document
          and inspect side-by-side comparison.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Top Header & Actions */}
      <CardHeader className="py-3 px-5 border-b border-slate-800 flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pixel-Perfect Output Ready</span>
            </CardTitle>
            <Badge variant="success" className="text-[10px] font-mono">
              <Clock className="w-3 h-3 mr-1 inline" />
              {processingTimeMs} ms
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {formatFileSize(modifiedPdfBytes.length)} • White-out & Redraw executed successfully
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5",
                viewMode === "side-by-side"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("toggle")}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5",
                viewMode === "toggle"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Toggle Flip</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.15))}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-slate-300 px-1">
              {Math.round(zoomScale * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={() => setZoomScale((s) => Math.min(2.0, s + 0.15))}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Download Button */}
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-500/25 shadow-md h-8 gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </CardHeader>

      {/* Main Canvas Comparison Area */}
      <CardContent className="flex-1 overflow-auto p-6 bg-slate-950/90">
        {viewMode === "side-by-side" ? (
          /* Side-by-Side Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-full">
            {/* Left: Original */}
            <div className="flex flex-col items-center">
              <div className="mb-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Original Document</span>
              </div>
              <div className="relative shadow-2xl rounded ring-1 ring-slate-800 bg-white">
                <canvas ref={originalCanvasRef} className="block" />
              </div>
            </div>

            {/* Right: Modified */}
            <div className="flex flex-col items-center">
              <div className="mb-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Modified Output (Pixel-Perfect)</span>
              </div>
              <div className="relative shadow-2xl rounded ring-1 ring-emerald-500/50 bg-white">
                <canvas ref={modifiedCanvasRef} className="block" />
              </div>
            </div>
          </div>
        ) : (
          /* Toggle Flip Mode Layout */
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-md">
              <button
                type="button"
                onClick={() => setActiveToggleTab("original")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2",
                  activeToggleTab === "original"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <span>Original PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveToggleTab("modified")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2",
                  activeToggleTab === "modified"
                    ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modified Output (Active)</span>
              </button>
            </div>

            <div className="relative shadow-2xl rounded ring-1 ring-slate-800 bg-white">
              <canvas ref={toggleCanvasRef} className="block" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
