"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, FileText, X, Upload } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RichTextEditor } from "@/components/agenda/RichTextEditor";
import { supabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface ProgrammeFormData {
  titre: string;
  description: string;
  description_html: string;
  document_url: string;
  pavillon: string;
  salle: string;
  starts_at: string;
  ends_at: string;
  type: string;
  speakers: string;
}

export const EVENT_TYPE_OPTIONS = ["conference", "atelier", "networking", "keynote", "panel"];

interface ProgrammeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProgrammeFormData;
  onChange: (data: ProgrammeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  editingId: string | null;
}

export function ProgrammeFormDialog({
  open,
  onOpenChange,
  formData,
  onChange,
  onSubmit,
  loading,
  editingId,
}: ProgrammeFormDialogProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const handleDescriptionChange = (html: string) => {
    const plainText = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    onChange({ ...formData, description_html: html, description: plainText });
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/events/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (res.ok) {
        onChange({ ...formData, document_url: data.url });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePdf = () => {
    onChange({ ...formData, document_url: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingId ? t("admin.programme.form_edit") : t("admin.programme.form_new")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <Input
            placeholder={t("admin.programme.form_title")}
            value={formData.titre}
            onChange={(e) => onChange({ ...formData, titre: e.target.value })}
            required
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("admin.programme.form_description")}
            </label>
            <RichTextEditor
              value={formData.description_html || ""}
              onChange={handleDescriptionChange}
              placeholder={t("admin.programme.form_description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder={t("admin.programme.form_pavillon")}
              value={formData.pavillon}
              onChange={(e) => onChange({ ...formData, pavillon: e.target.value })}
            />
            <Input
              placeholder={t("admin.programme.form_salle")}
              value={formData.salle}
              onChange={(e) => onChange({ ...formData, salle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">
                {t("admin.programme.form_start")}
              </label>
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => onChange({ ...formData, starts_at: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                {t("admin.programme.form_end")}
              </label>
              <Input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => onChange({ ...formData, ends_at: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          <select
            value={formData.type}
            onChange={(e) => onChange({ ...formData, type: e.target.value })}
            className="flex h-9 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {EVENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <Input
            placeholder={t("admin.programme.form_speakers")}
            value={formData.speakers}
            onChange={(e) => onChange({ ...formData, speakers: e.target.value })}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Document (PDF)
            </label>
            {formData.document_url ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <FileText className="size-5 shrink-0 text-primary" />
                <span className="flex-1 truncate text-sm text-foreground">
                  {formData.document_url.split("/").pop()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePdf}
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 px-4 py-4",
                  "text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    {t("admin.programme.form_description")}
                    Cliquez pour ajouter un PDF (max 10 Mo)
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleUploadPdf}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || uploading} className="rounded-xl">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? t("admin.programme.form_save") : t("admin.programme.form_create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
