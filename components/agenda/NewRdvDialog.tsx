"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface NewRdvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    destinataireId: string,
    startsAt: string,
    endsAt: string,
    notes?: string,
  ) => Promise<unknown>;
}

export function NewRdvDialog({ open, onOpenChange, onCreate }: NewRdvDialogProps) {
  const { t } = useTranslation();
  const [destinataireId, setDestinataireId] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<
    { id: string; full_name: string | null; company: string | null; avatar_url: string | null }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDestinataireId("");
      setDate("");
      setTimeStart("");
      setTimeEnd("");
      setNotes("");
      setSearchQuery("");
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) return;
    const fetchContacts = async () => {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company, avatar_url")
        .not("full_name", "is", null)
        .or(`full_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
        .limit(20);
      if (data) setContacts(data as typeof contacts);
    };
    fetchContacts();
  }, [open, searchQuery]);

  const handleSubmit = async () => {
    if (!destinataireId || !date || !timeStart || !timeEnd) {
      toast.error(t("agenda.rdv_form_required"));
      return;
    }

    const selectedDate = new Date(`${date}T${timeStart}`);
    const selectedEnd = new Date(`${date}T${timeEnd}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    if (selectedDate < today) {
      toast.error(t("agenda.rdv_form_past"));
      return;
    }

    if (selectedDate.getFullYear() > currentYear) {
      toast.error(t("agenda.rdv_form_beyond_year"));
      return;
    }

    if (selectedEnd <= selectedDate) {
      toast.error(t("agenda.rdv_form_end_before_start"));
      return;
    }

    setSubmitting(true);
    try {
      const startsAt = selectedDate.toISOString();
      const endsAt = selectedEnd.toISOString();
      await onCreate(destinataireId, startsAt, endsAt, notes || undefined);
      toast.success(t("agenda.rdv_form_sent"));
      onOpenChange(false);
    } catch {
      toast.error(t("agenda.rdv_form_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl flex flex-col gap-0 p-0 max-h-[90dvh] overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-xl font-semibold">{t("agenda.rdv_form_title")}</DialogTitle>
          <DialogDescription>{t("agenda.rdv_form_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-2 w-full overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("agenda.rdv_form_contact")}</Label>
            <Input
              placeholder={t("agenda.rdv_form_search")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDestinataireId("");
              }}
              className="rounded-xl"
            />
            {contacts.length > 0 && !destinataireId && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-1">
                {contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    onClick={() => {
                      setDestinataireId(c.id);
                      setSearchQuery(c.full_name || c.company || "");
                    }}
                  >
                    <Avatar className="mr-2.5 size-7 shrink-0">
                      {c.avatar_url ? <AvatarImage src={c.avatar_url} /> : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {c.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">{c.full_name || "Contact"}</p>
                      {c.company && (
                        <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("agenda.rdv_form_date")}</Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              max={`${new Date().getFullYear()}-12-31`}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("agenda.rdv_form_start")}</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("agenda.rdv_form_end")}</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("agenda.rdv_form_notes")}</Label>
            <Textarea
              placeholder={t("agenda.rdv_form_notes_placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 p-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl w-full sm:w-auto">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl gap-1.5 w-full sm:w-auto">
            {submitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t("agenda.rdv_form_sending")}
              </>
            ) : (
              t("agenda.rdv_form_send")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
