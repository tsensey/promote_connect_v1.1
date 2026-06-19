"use client";

import { useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
}

export function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
        error={
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-8 text-muted-foreground/40" />
            <p>Impossible d&apos;afficher l&apos;aperçu</p>
          </div>
        }
        className="flex flex-col items-center"
      >
        <Page
          pageNumber={pageNumber}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="max-w-full"
          width={Math.min(600, typeof window !== "undefined" ? window.innerWidth - 80 : 600)}
        />
      </Document>

      {numPages && numPages > 1 && (
        <div className="mt-3 flex items-center gap-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber >= (numPages || 1)}
            onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}

      {!loading && numPages === 0 && (
        <p className="py-4 text-sm text-muted-foreground">Ce document est vide</p>
      )}
    </div>
  );
}
