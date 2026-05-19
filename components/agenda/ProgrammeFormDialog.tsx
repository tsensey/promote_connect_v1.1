"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface ProgrammeFormData {
  titre: string;
  description: string;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingId ? t("admin.programme.form_edit") : t("admin.programme.form_new")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3 py-4">
          <Input
            placeholder={t("admin.programme.form_title")}
            value={formData.titre}
            onChange={(e) => onChange({ ...formData, titre: e.target.value })}
            required
            className="col-span-full"
          />
          <Textarea
            placeholder={t("admin.programme.form_description")}
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={3}
            className="col-span-full"
          />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? t("admin.programme.form_save") : t("admin.programme.form_create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
