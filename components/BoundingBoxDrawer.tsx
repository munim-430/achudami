"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Move,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { FieldBoundingBox } from "@/lib/types";
import {
  canvasToPdfCoordinates,
  pdfToCanvasCoordinates,
  getCanvasRelativePoint,
  roundToPrecision,
} from "@/lib/coordinateUtils";
import { cn } from "@/lib/utils";

// Ensure worker is configured on the client
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

interface BoundingBoxDrawerProps {
  pdfBytes: Uint8Array | null;
  boxes: FieldBoundingBox[];
  activeFieldKey: string;
  onActiveFieldChange: (key: string) => void;
  onBoxChange: (box: FieldBoundingBox) => void;
  onPageSizeDetermined?: (size: { width: number; height: number }) => void;
  isCalibrating: boolean;
  onToggleCalibration: () => void;
}

type DragAction = "create" | "move" | "resize" | null;
type ResizeHandle = "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | null;

const FIELD_COLORS: Record<string, { stroke: string; fill: string; bg: string; text: string }> = {
  course: {
    stroke: "#3b82f6",
    fill: "rgba(59, 130, 246, 0.22)",
    bg: "bg-blue-600",
    text: "text-blue-400",
  },
  studyPeriod: {
    stroke: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.22)",
    bg: "bg-amber-600",
    text: "text-amber-400",
  },
  certText: {
    stroke: "#10b981",
    fill: "rgba(16, 185, 129, 0.22)",
    bg: "bg-emerald-600",
    text: "text-emerald-400",
  },
};

const DEFAULT_FIELD_COLOR = {
  stroke: "#8b5cf6",
  fill: "rgba(139, 92, 246, 0.22)",
  bg: "bg-purple-600",
  text: "text-purple-400",
};

export const BoundingBoxDrawer: React.FC<BoundingBoxDrawerProps> = ({
  pdfBytes,
  boxes,
  activeFieldKey,
  onActiveFieldChange,
  onBoxChange,
  onPageSizeDetermined,
  isCalibrating,
  onToggleCalibration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagePtSize, setPagePtSize] = useState<{ width: number; height: number }>({
    width: 595,
    height: 841,
  });

  const [scale, setScale] = useState<number>(1.25);
  const [isRendering, setIsRendering] = useState(false);

  // Drag interaction states
  const [dragAction, setDragAction] = useState<DragAction>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentDragRect, setCurrentDragRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [initialBoxOnDrag, setInitialBoxOnDrag] = useState<FieldBoundingBox | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      if (!pdfBytes || pdfBytes.length === 0) {
        setPdfDoc(null);
        return;
      }

      try {
        setIsRendering(true);
        // Copy bytes to avoid transfer issues
        const dataCopy = new Uint8Array(pdfBytes);
        const loadingTask = pdfjsLib.getDocument({
          data: dataCopy,
          cMapUrl: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);

        const firstPage = await doc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const size = { width: viewport.width, height: viewport.height };
        setPagePtSize(size);
        if (onPageSizeDetermined) {
          onPageSizeDetermined(size);
        }
      } catch (err) {
        console.error("Failed to load PDF in viewer:", err);
      } finally {
        setIsRendering(false);
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, onPageSizeDetermined]);

  // Render current page to Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setIsRendering(true);
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error("Failed to render PDF page:", err);
    } finally {
      setIsRendering(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Active Box
  const activeBox = boxes.find((b) => b.key === activeFieldKey) || boxes[0];

  // Mouse interaction handlers for Calibration
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating || !canvasRef.current) return;

    const pt = getCanvasRelativePoint(e.clientX, e.clientY, canvasRef.current);
    setStartPoint(pt);

    // If clicking directly on empty area, initiate new box drawing for active field
    setDragAction("create");
    setCurrentDragRect({
      x: pt.x,
      y: pt.y,
      width: 0,
      height: 0,
    });
  };

  const handleStartMove = (e: React.MouseEvent, box: FieldBoundingBox) => {
    e.stopPropagation();
    if (!isCalibrating || !canvasRef.current) return;

    onActiveFieldChange(box.key);
    const pt = getCanvasRelativePoint(e.clientX, e.clientY, canvasRef.current);
    setStartPoint(pt);
    setDragAction("move");
    setInitialBoxOnDrag({ ...box });
  };

  const handleStartResize = (
    e: React.MouseEvent,
    box: FieldBoundingBox,
    handle: ResizeHandle
  ) => {
    e.stopPropagation();
    if (!isCalibrating || !canvasRef.current) return;

    onActiveFieldChange(box.key);
    const pt = getCanvasRelativePoint(e.clientX, e.clientY, canvasRef.current);
    setStartPoint(pt);
    setDragAction("resize");
    setResizeHandle(handle);
    setInitialBoxOnDrag({ ...box });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragAction || !canvasRef.current) return;

    const currentPt = getCanvasRelativePoint(e.clientX, e.clientY, canvasRef.current);

    if (dragAction === "create") {
      const minX = Math.min(startPoint.x, currentPt.x);
      const minY = Math.min(startPoint.y, currentPt.y);
      const width = Math.abs(currentPt.x - startPoint.x);
      const height = Math.abs(currentPt.y - startPoint.y);

      setCurrentDragRect({
        x: minX,
        y: minY,
        width,
        height,
      });
    } else if (dragAction === "move" && initialBoxOnDrag) {
      const deltaX = (currentPt.x - startPoint.x) / scale;
      const deltaY = -(currentPt.y - startPoint.y) / scale; // inverted Y

      const newX = roundToPrecision(Math.max(0, initialBoxOnDrag.x + deltaX), 2);
      const newY = roundToPrecision(Math.max(0, initialBoxOnDrag.y + deltaY), 2);

      onBoxChange({
        ...initialBoxOnDrag,
        x: newX,
        y: newY,
      });
    } else if (dragAction === "resize" && initialBoxOnDrag && resizeHandle) {
      const deltaX = (currentPt.x - startPoint.x) / scale;
      const deltaY = -(currentPt.y - startPoint.y) / scale;

      let newX = initialBoxOnDrag.x;
      let newY = initialBoxOnDrag.y;
      let newWidth = initialBoxOnDrag.width;
      let newHeight = initialBoxOnDrag.height;

      if (resizeHandle.includes("e")) {
        newWidth = Math.max(10, initialBoxOnDrag.width + deltaX);
      }
      if (resizeHandle.includes("w")) {
        const potentialWidth = initialBoxOnDrag.width - deltaX;
        if (potentialWidth >= 10) {
          newX = initialBoxOnDrag.x + deltaX;
          newWidth = potentialWidth;
        }
      }
      if (resizeHandle.includes("n")) {
        // Top edge in PDF is y + height. Pulling up increases height.
        newHeight = Math.max(8, initialBoxOnDrag.height + deltaY);
      }
      if (resizeHandle.includes("s")) {
        // Bottom edge in PDF is y. Pulling down decreases y and increases height.
        const potentialHeight = initialBoxOnDrag.height - deltaY;
        if (potentialHeight >= 8) {
          newY = initialBoxOnDrag.y + deltaY;
          newHeight = potentialHeight;
        }
      }

      onBoxChange({
        ...initialBoxOnDrag,
        x: roundToPrecision(newX, 2),
        y: roundToPrecision(newY, 2),
        width: roundToPrecision(newWidth, 2),
        height: roundToPrecision(newHeight, 2),
      });
    }
  };

  const handleMouseUp = () => {
    if (!dragAction) return;

    if (dragAction === "create" && currentDragRect && activeBox) {
      // Only commit if user dragged at least 5x5 pixels
      if (currentDragRect.width >= 5 && currentDragRect.height >= 5) {
        const pdfCoords = canvasToPdfCoordinates(
          currentDragRect,
          scale,
          pagePtSize.height
        );

        onBoxChange({
          ...activeBox,
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
        });
      }
    }

    setDragAction(null);
    setResizeHandle(null);
    setCurrentDragRect(null);
    setInitialBoxOnDrag(null);
  };

  const zoomIn = () => setScale((s) => Math.min(2.5, roundToPrecision(s + 0.15, 2)));
  const zoomOut = () => setScale((s) => Math.max(0.6, roundToPrecision(s - 0.15, 2)));
  const resetZoom = () => setScale(1.25);

  const getFieldColor = (key: string) => {
    return FIELD_COLORS[key] || DEFAULT_FIELD_COLOR;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        {/* Left: Mode Indicator & Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isCalibrating ? "default" : "secondary"}
            onClick={onToggleCalibration}
            className={cn(
              "text-xs h-8 gap-1.5 font-medium transition-all",
              isCalibrating
                ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 shadow-md"
                : "text-slate-300 hover:text-white"
            )}
          >
            {isCalibrating ? (
              <>
                <Crosshair className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
                <span>Calibration Mode Active</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Calibrate Coordinates</span>
              </>
            )}
          </Button>

          <Badge
            variant={isCalibrating ? "default" : "secondary"}
            className="text-[11px] font-mono py-0.5 px-2"
          >
            {pagePtSize.width} × {pagePtSize.height} pt
          </Badge>
        </div>

        {/* Center: Quick Active Field Selector (when in calibration) */}
        {isCalibrating && (
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 px-1 font-medium">Draw for:</span>
            {boxes.map((box) => {
              const color = getFieldColor(box.key);
              const isActive = box.key === activeFieldKey;
              return (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => onActiveFieldChange(box.key)}
                  className={cn(
                    "px-2.5 py-0.5 text-xs rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-600"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color.stroke }}
                  />
                  <span>{box.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Zoom & Page Controls */}
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800 text-xs text-slate-300 mr-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="hover:text-white disabled:opacity-30 p-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="hover:text-white disabled:opacity-30 p-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={zoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={zoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={resetZoom}
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calibration Guide Alert Banner */}
      {isCalibrating && (
        <div className="bg-indigo-950/50 border-b border-indigo-900/60 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Calibration Mode:</strong> Click and drag anywhere on the document to draw a
              bounding box for <strong>{activeBox?.name}</strong>, or drag existing box edges to
              fine-tune coordinates.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-indigo-300/80">
              [X: {activeBox?.x} | Y: {activeBox?.y} | W: {activeBox?.width} | H: {activeBox?.height}]
            </span>
          </div>
        </div>
      )}

      {/* PDF Canvas & Bounding Box Workspace */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/90 relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {!pdfBytes ? (
          <div className="text-center p-12 text-slate-500 space-y-2">
            <Layers className="w-12 h-12 mx-auto stroke-1 opacity-40" />
            <p className="text-sm font-medium">No PDF loaded for preview</p>
            <p className="text-xs">Upload a document or load the sample acceptance letter above.</p>
          </div>
        ) : (
          <div
            className="relative shadow-2xl rounded-sm transition-all"
            onMouseDown={handleMouseDown}
            style={{
              cursor: isCalibrating ? (dragAction ? "crosshair" : "crosshair") : "default",
            }}
          >
            {/* The PDF Canvas */}
            <canvas
              ref={canvasRef}
              className={cn(
                "block bg-white shadow-2xl ring-1 ring-slate-800 transition-opacity",
                isRendering ? "opacity-80" : "opacity-100"
              )}
            />

            {/* Interactive Bounding Box Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {boxes
                .filter((box) => box.pageNumber === currentPage)
                .map((box) => {
                  const canvasRect = pdfToCanvasCoordinates(box, scale, pagePtSize.height);
                  const isActive = box.key === activeFieldKey;
                  const color = getFieldColor(box.key);

                  return (
                    <div
                      key={box.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onActiveFieldChange(box.key);
                      }}
                      onMouseDown={(e) => handleStartMove(e, box)}
                      style={{
                        position: "absolute",
                        left: `${canvasRect.x}px`,
                        top: `${canvasRect.y}px`,
                        width: `${canvasRect.width}px`,
                        height: `${canvasRect.height}px`,
                        borderColor: color.stroke,
                        backgroundColor: isCalibrating ? color.fill : "transparent",
                      }}
                      className={cn(
                        "transition-all duration-75",
                        isCalibrating ? "pointer-events-auto" : "pointer-events-none",
                        isCalibrating
                          ? "border-2 cursor-move group"
                          : "border border-dashed opacity-40 hover:opacity-80",
                        isActive && isCalibrating
                          ? "ring-2 ring-white/70 shadow-lg z-20"
                          : "z-10"
                      )}
                    >
                      {/* Box Title Badge */}
                      {isCalibrating && (
                        <div
                          className={cn(
                            "absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap text-white shadow-md flex items-center gap-1",
                            color.bg
                          )}
                        >
                          <span>{box.name}</span>
                          <span className="opacity-75 font-mono text-[9px]">
                            {box.width}×{box.height}pt
                          </span>
                        </div>
                      )}

                      {/* Resize Handles (Only for active box in calibration mode) */}
                      {isCalibrating && isActive && (
                        <>
                          {/* NW */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "nw")}
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-slate-900 rounded-sm cursor-nwse-resize shadow z-30"
                          />
                          {/* NE */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "ne")}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-slate-900 rounded-sm cursor-nesw-resize shadow z-30"
                          />
                          {/* SE */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "se")}
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-slate-900 rounded-sm cursor-nwse-resize shadow z-30"
                          />
                          {/* SW */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "sw")}
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-slate-900 rounded-sm cursor-nesw-resize shadow z-30"
                          />
                          {/* E */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "e")}
                            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-white border border-slate-900 rounded-sm cursor-ew-resize shadow z-30"
                          />
                          {/* W */}
                          <div
                            onMouseDown={(e) => handleStartResize(e, box, "w")}
                            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-4 bg-white border border-slate-900 rounded-sm cursor-ew-resize shadow z-30"
                          />
                        </>
                      )}
                    </div>
                  );
                })}

              {/* Temporary In-Progress Drag Box */}
              {dragAction === "create" && currentDragRect && (
                <div
                  style={{
                    position: "absolute",
                    left: `${currentDragRect.x}px`,
                    top: `${currentDragRect.y}px`,
                    width: `${currentDragRect.width}px`,
                    height: `${currentDragRect.height}px`,
                  }}
                  className="border-2 border-indigo-400 bg-indigo-500/30 pointer-events-none z-30 animate-pulse rounded-sm"
                >
                  <div className="absolute -top-6 left-0 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow">
                    Drawing {activeBox?.name || "Box"}...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
