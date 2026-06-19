"use client";

import { useState, useCallback, useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfPreviewProps {
  url: string;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const BASE_WIDTH = 750;

function PdfControls({
  pageNumber,
  numPages,
  scale,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  isFullscreen,
}: {
  pageNumber: number;
  numPages: number | null;
  scale: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const showMultiPage = numPages && numPages > 1;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 border-b border-border/50 bg-muted/20 px-3 py-2">
      {showMultiPage && (
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={onPrev}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="mx-1 min-w-[4rem] text-center text-xs tabular-nums text-muted-foreground">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pageNumber >= (numPages || 1)}
            onClick={onNext}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border/40" />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={scale <= MIN_ZOOM}
        onClick={onZoomOut}
        className="h-7 w-7 p-0"
        title="Zoom arrière"
      >
        <ZoomOut className="size-3.5" />
      </Button>
      <span className="mx-1 min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(scale * 100)}%
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={scale >= MAX_ZOOM}
        onClick={onZoomIn}
        className="h-7 w-7 p-0"
        title="Zoom avant"
      >
        <ZoomIn className="size-3.5" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border/40" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="h-7 w-7 p-0"
        title={isFullscreen ? "Fermer" : "Plein écran"}
      >
        {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      </Button>
    </div>
  );
}

function PdfDocument({
  url,
  scale,
  pageNumber,
  onLoadSuccess,
  isFullscreen,
}: {
  url: string;
  scale: number;
  pageNumber: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  isFullscreen: boolean;
}) {
  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
      loading={
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
      error={
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <FileText className="size-10 text-muted-foreground/40" />
          <p>Impossible d&apos;afficher l&apos;aperçu</p>
        </div>
      }
      className="flex flex-col items-center"
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="max-w-full"
      />
    </Document>
  );
}

export function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(BASE_WIDTH);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  useEffect(() => {
    function updateWidth() {
      setContainerWidth(Math.min(900, window.innerWidth - 80));
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  const content = (
    <div className="flex flex-col items-center">
      <PdfControls
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
        onNext={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
        onZoomIn={() => setScale((s) => Math.min(MAX_ZOOM, +(s + ZOOM_STEP).toFixed(2)))}
        onZoomOut={() => setScale((s) => Math.max(MIN_ZOOM, +(s - ZOOM_STEP).toFixed(2)))}
        onFullscreen={() => setFullscreen((f) => !f)}
        isFullscreen={fullscreen}
      />

      <div className={cn("flex-1 overflow-auto", fullscreen ? "w-full" : "w-full max-w-4xl")}>
        <div className="flex justify-center p-4">
          <PdfDocument
            url={url}
            scale={scale}
            pageNumber={pageNumber}
            onLoadSuccess={onLoadSuccess}
            isFullscreen={fullscreen}
          />
        </div>
      </div>

      {!numPages && (
        <p className="py-4 text-sm text-muted-foreground">Ce document est vide</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border/50 bg-background px-4 py-2">
          <span className="text-sm font-medium text-foreground">
            {url.split("/").pop()?.replace(/^\d+-/, "") || "Document"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScale(1)}
              className="h-7 text-xs"
              title="Réinitialiser le zoom"
            >
              <RotateCw className="mr-1 size-3" />
              Réinitialiser
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(false)}
              className="h-7 w-7 p-0"
              title="Fermer"
            >
              <Minimize className="size-4" />
            </Button>
          </div>
        </div>
        <PdfControls
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNext={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
          onZoomIn={() => setScale((s) => Math.min(MAX_ZOOM, +(s + ZOOM_STEP).toFixed(2)))}
          onZoomOut={() => setScale((s) => Math.max(MIN_ZOOM, +(s - ZOOM_STEP).toFixed(2)))}
          onFullscreen={() => setFullscreen(false)}
          isFullscreen={true}
        />
        <div className="flex-1 overflow-auto">
          <div className="flex justify-center p-6">
            <PdfDocument
              url={url}
              scale={scale}
              pageNumber={pageNumber}
              onLoadSuccess={onLoadSuccess}
              isFullscreen={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return content;
}
