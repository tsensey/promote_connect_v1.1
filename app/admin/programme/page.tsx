"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Plus, Search, Edit, Trash2, Calendar } from "lucide-react";
import type { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import {
  ProgrammeFormDialog,
  type ProgrammeFormData,
} from "@/components/agenda/ProgrammeFormDialog";

type Evenement = Database["public"]["Tables"]["evenements"]["Row"];

const typeStyles: Record<string, string> = {
  conference: "bg-primary/10 text-primary",
  atelier: "bg-secondary/20 text-secondary-foreground",
  networking: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  keynote: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  panel: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const INITIAL_FORM: ProgrammeFormData = {
  titre: "",
  description: "",
  pavillon: "",
  salle: "",
  starts_at: "",
  ends_at: "",
  type: "conference",
  speakers: "",
};

export default function AdminProgrammePage() {
  const { t, locale } = useTranslation();
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<ProgrammeFormData>(INITIAL_FORM);

  const fetchEvenements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseClient
      .from("evenements")
      .select("*")
      .order("starts_at", { ascending: true });
    if (data) setEvenements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvenements();
  }, [fetchEvenements]);

  const openNewForm = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setShowForm(true);
  };

  const handleEdit = (evt: Evenement) => {
    const speakers = Array.isArray(evt.speakers) ? evt.speakers.join(", ") : "";
    setFormData({
      titre: evt.titre || "",
      description: evt.description || "",
      pavillon: evt.pavillon || "",
      salle: evt.salle || "",
      starts_at: evt.starts_at
        ? new Date(evt.starts_at).toISOString().slice(0, 16)
        : "",
      ends_at: evt.ends_at
        ? new Date(evt.ends_at).toISOString().slice(0, 16)
        : "",
      type: evt.type || "conference",
      speakers,
    });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      ...formData,
      speakers: formData.speakers
        ? formData.speakers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
    };

    if (editingId) {
      const { error } = await supabaseClient
        .from("evenements")
        .update(payload)
        .eq("id", editingId);
      if (!error) {
        setShowForm(false);
        setEditingId(null);
        fetchEvenements();
      }
    } else {
      const { error } = await supabaseClient.from("evenements").insert(payload);
      if (!error) {
        setShowForm(false);
        fetchEvenements();
      }
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.programme.delete_confirm"))) return;
    await supabaseClient.from("evenements").delete().eq("id", id);
    fetchEvenements();
  };

  const filtered = evenements.filter((evt) =>
    evt.titre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {t("admin.programme.title")}
          </p>
          <h1 className="text-4xl text-foreground">{t("admin.programme.subtitle")}</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {t("admin.programme.desc")}
          </p>
        </div>
        <Button onClick={openNewForm} className="rounded-xl">
          <Plus className="mr-2 size-4" /> {t("admin.programme.add")}
        </Button>
      </div>

      <div className="surface-panel">
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("admin.programme.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.programme.col_event")}</TableHead>
                <TableHead>{t("admin.programme.col_type")}</TableHead>
                <TableHead>{t("admin.programme.col_location")}</TableHead>
                <TableHead>{t("admin.programme.col_date")}</TableHead>
                <TableHead className="text-right">{t("admin.programme.col_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto h-5 w-16 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((evt) => (
                  <TableRow key={evt.id} className="group">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{evt.titre}</div>
                        {evt.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-full border-0",
                          typeStyles[evt.type || "conference"],
                        )}
                      >
                        {evt.type || "conference"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {evt.pavillon && (
                        <span>
                          {t("admin.programme.col_location")} {evt.pavillon}{" "}
                        </span>
                      )}
                      {evt.salle && (
                        <span>
                          - {evt.salle}
                        </span>
                      )}
                      {!evt.pavillon && !evt.salle && <span>—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {evt.starts_at && (
                        <span>
                          {new Date(evt.starts_at).toLocaleDateString(
                            locale === "en" ? "en-US" : "fr-FR",
                            { day: "numeric", month: "short" },
                          )}{" "}
                          -{" "}
                          {new Date(evt.starts_at).toLocaleTimeString(
                            locale === "en" ? "en-US" : "fr-FR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(evt)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(evt.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Calendar className="mx-auto mb-3 size-10 text-muted-foreground" />
                    {t("admin.programme.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProgrammeFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        loading={formLoading}
        editingId={editingId}
      />
    </div>
  );
}
