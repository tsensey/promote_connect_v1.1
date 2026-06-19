"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Plus, Search, Edit, Trash2, Calendar } from "lucide-react";
import type { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AdminPagination } from "@/components/shared/AdminPagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";


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
  description_html: "",
  document_url: "",
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState<ProgrammeFormData>(INITIAL_FORM);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    let speakers = "";
    if (Array.isArray(evt.speakers)) {
      speakers = evt.speakers
        .map((s: unknown) => (typeof s === "object" && s !== null ? (s as Record<string, unknown>).name ?? String(s) : String(s)))
        .filter(Boolean)
        .join(", ");
    }

    let descriptionHtml = evt.description_html || "";
    if (!descriptionHtml && evt.description) {
      descriptionHtml = `<p>${evt.description.replace(/\n/g, "<br>")}</p>`;
    }

    setFormData({
      titre: evt.titre || "",
      description: evt.description || "",
      description_html: descriptionHtml,
      document_url: evt.document_url || "",
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

  const submitPayload = async (
    payload: Record<string, unknown>,
    retry = true,
  ): Promise<boolean> => {
    const table = supabaseClient.from("evenements");
    const { error } = editingId
      ? await table.update(payload as never).eq("id", editingId)
      : await table.insert(payload as never);
    if (error) {
      if (retry && (error.message?.includes("column") || error.code === "42703")) {
        toast.warning("Les colonnes description_html et document_url n'existent pas encore en base. Appliquez la migration 090. Les champs riches ont été ignorés pour cette sauvegarde.");
        const safe: Record<string, unknown> = {};
        for (const key of Object.keys(payload)) {
          if (key !== "description_html" && key !== "document_url") {
            safe[key] = payload[key];
          }
        }
        return submitPayload(safe, false);
      }
      toast.error(`Erreur lors de la sauvegarde : ${error.message}`);
    }
    return !error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const payload: Record<string, unknown> = {
      titre: formData.titre,
      description: formData.description,
      pavillon: formData.pavillon,
      salle: formData.salle,
      type: formData.type,
      speakers: formData.speakers
        ? formData.speakers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ name }))
        : [],
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
    };
    if (formData.description_html) payload.description_html = formData.description_html;
    if (formData.document_url) payload.document_url = formData.document_url;

    const ok = await submitPayload(payload);
    if (ok) {
      setShowForm(false);
      setEditingId(null);
      fetchEvenements();
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabaseClient.from("evenements").delete().eq("id", deleteTarget);
    setDeleteLoading(false);
    if (!error) {
      setDeleteTarget(null);
      fetchEvenements();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);
    const { error } = await supabaseClient.from("evenements").delete().in("id", selectedIds);
    setBulkDeleteLoading(false);
    if (!error) {
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchEvenements();
    }
  };

  const filtered = evenements.filter((evt) =>
    evt.titre.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteConfirm(true)} className="rounded-xl">
              <Trash2 className="mr-2 size-4" /> Supprimer ({selectedIds.length})
            </Button>
          )}
          <Button onClick={openNewForm} className="rounded-xl">
            <Plus className="mr-2 size-4" /> {t("admin.programme.add")}
          </Button>
        </div>
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
                <TableHead className="w-12">
                  <Checkbox 
                    checked={paginated.length > 0 && paginated.every(evt => selectedIds.includes(evt.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newIds = new Set(selectedIds);
                        paginated.forEach(evt => newIds.add(evt.id));
                        setSelectedIds(Array.from(newIds));
                      } else {
                        const newIds = selectedIds.filter(id => !paginated.some(evt => evt.id === id));
                        setSelectedIds(newIds);
                      }
                    }}
                  />
                </TableHead>
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
                      <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                    </TableCell>
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
              ) : paginated.length > 0 ? (
                paginated.map((evt) => (
                  <TableRow key={evt.id} className="group">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(evt.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, evt.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== evt.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{evt.titre}</div>
                        {/* {evt.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {evt.description}
                          </p>
                        )} */}
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
                          onClick={() => setDeleteTarget(evt.id)}
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
        {!loading && filtered.length > 0 && (
          <AdminPagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        )}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.`}
        confirmLabel={deleteLoading ? "Suppression..." : "Supprimer"}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDelete}
        loading={deleteLoading}
        destructive
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer les ${selectedIds.length} événements sélectionnés ? Cette action est irréversible.`}
        confirmLabel={bulkDeleteLoading ? "Suppression..." : "Supprimer définitivement"}
        cancelLabel={t("common.cancel")}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
        destructive
      />
    </div>
  );
}
