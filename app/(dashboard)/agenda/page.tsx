"use client";

import { useState, useEffect, useMemo } from "react";
import { useEvenements, useRendezVous } from "@/hooks/useAgenda";
import { useAuth } from "@/lib/auth/context";
import { supabaseClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
  Check,
  Search,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirme",
  cancelled: "Annule",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const EVENT_TYPES = ["conference", "atelier", "networking", "keynote", "panel"];

export default function AgendaPage() {
  const { evenements, loading: eventsLoading } = useEvenements();
  const {
    rdvs,
    loading: rdvsLoading,
    createRdv,
    updateRdvStatus,
  } = useRendezVous();
  const [showNewRdv, setShowNewRdv] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [rdvFilter, setRdvFilter] = useState<string>("all");
  const [eventSearch, setEventSearch] = useState("");
  const { user } = useAuth();
  const myUserId = user?.id;



  const filteredEvenements = useMemo(() => {
    return evenements
      .filter((evt) => eventFilter === "all" || evt.type === eventFilter)
      .filter(
        (evt) =>
          eventSearch === "" ||
          evt.titre.toLowerCase().includes(eventSearch.toLowerCase()) ||
          evt.description?.toLowerCase().includes(eventSearch.toLowerCase()),
      );
  }, [evenements, eventFilter, eventSearch]);

  const filteredRdvs = useMemo(() => {
    return rdvs.filter((rdv) => rdvFilter === "all" || rdv.status === rdvFilter);
  }, [rdvs, rdvFilter]);

  const upcomingRdvs = useMemo(
    () =>
      rdvs.filter(
        (rdv) =>
          rdv.status === "confirmed" && new Date(rdv.starts_at) >= new Date(),
      ),
    [rdvs],
  );

  return (
    <>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading text-foreground">
              Agenda interactif
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Consultez le programme du salon et gerez vos rendez-vous B2B.
            </p>
          </div>
          <Button
            onClick={() => setShowNewRdv(true)}
            className="rounded-xl whitespace-nowrap"
          >
            <Plus className="mr-2 size-4" />
            Demander un RDV
          </Button>
        </div>

        {upcomingRdvs.length > 0 && (
          <Card className="surface-panel overflow-hidden border-0">
            <div className="brand-gradient px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarDays className="size-4" />
                Prochains rendez-vous ({upcomingRdvs.length})
              </h3>
            </div>
            <CardContent className="flex flex-wrap gap-3 p-4">
              {upcomingRdvs.slice(0, 3).map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-sm"
                >
                  <Avatar className="size-9 border border-border/50">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {rdv.other_user?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {rdv.other_user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rdv.starts_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      a{" "}
                      {new Date(rdv.starts_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="programme" className={"flex flex-col"}>
          <TabsList className="rounded-xl bg-muted/80 p-1">
            <TabsTrigger value="programme" className="rounded-xl">
              Programme du Salon
            </TabsTrigger>
            <TabsTrigger value="rdvs" className="rounded-xl">
              Mon planning B2B
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programme" className="mt-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un evenement..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-white/90 pl-11"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={eventFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventFilter("all")}
                  className="rounded-full"
                >
                  Tous
                </Button>
                {EVENT_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={eventFilter === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEventFilter(type)}
                    className="rounded-full capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="surface-panel h-24 animate-pulse border-0 rounded-xl"
                  />
                ))}
              </div>
            ) : filteredEvenements.length === 0 ? (
              <Card className="surface-panel border-0">
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <Calendar className="size-16 text-muted-foreground/30" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Aucun evenement trouve
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Essayez de modifier vos filtres de recherche.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredEvenements.map((evt) => (
                  <div
                    key={evt.id}
                    className="surface-panel group border-0 rounded-xl transition-all hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row">
                      <div className="flex shrink-0 flex-col items-center rounded-xl border border-border/60 bg-white/80 px-4 py-3 text-center sm:w-20">
                        <span className="text-xs font-bold uppercase text-primary">
                          {new Date(evt.starts_at).toLocaleDateString("fr-FR", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {new Date(evt.starts_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-heading font-semibold text-foreground group-hover:text-primary">
                                {evt.titre}
                              </h3>
                              {evt.type && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-border/60 text-xs capitalize"
                                >
                                  {evt.type}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {evt.description || "Aucune description"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {new Date(evt.starts_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(evt.ends_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {evt.pavillon && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-3.5" />
                              Pavillon {evt.pavillon}
                            </span>
                          )}
                          {evt.salle && (
                            <span className="flex items-center gap-1.5">
                              Salle {evt.salle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rdvs" className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "confirmed", "cancelled"] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={rdvFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRdvFilter(status)}
                    className="rounded-full"
                  >
                    {status === "all" ? "Tous" : STATUS_LABELS[status]}
                    {status !== "all" && (
                      <span className="ml-1 text-xs opacity-70">
                        ({rdvs.filter((r) => r.status === status).length})
                      </span>
                    )}
                  </Button>
                ),
              )}
            </div>

            {rdvsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="surface-panel h-24 animate-pulse border-0 rounded-xl"
                  />
                ))}
              </div>
            ) : filteredRdvs.length === 0 ? (
              <Card className="surface-panel border-0">
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <CalendarDays className="size-16 text-muted-foreground/30" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Aucun rendez-vous
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Commencez par demander un rendez-vous a un exposant.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowNewRdv(true)}
                    className="rounded-xl"
                  >
                    <Plus className="mr-2 size-4" />
                    Demander un RDV
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRdvs.map((rdv) => (
                  <div
                    key={rdv.id}
                    className={cn(
                      "surface-panel group border rounded-xl transition-all hover:shadow-lg",
                      rdv.status === "pending" && rdv.destinataire_id === myUserId
                        ? "border-amber-300/60 bg-amber-50/50 shadow-amber-100/50"
                        : "border-border/40"
                    )}
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-12 border-2 border-border/50">
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {rdv.other_user?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-heading text-lg font-semibold text-foreground">
                            {rdv.other_user?.full_name || "Contact"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3.5" />
                              {new Date(rdv.starts_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {new Date(rdv.starts_at).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}{" "}
                              -{" "}
                              {new Date(rdv.ends_at).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          {rdv.notes && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {rdv.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            STATUS_STYLES[rdv.status || "pending"],
                          )}
                        >
                          {STATUS_LABELS[rdv.status || "pending"]}
                        </Badge>

                        {rdv.status === "pending" &&
                          rdv.destinataire_id === myUserId && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                                onClick={() => {
                                  updateRdvStatus(rdv.id, "confirmed")
                                    .then(() => toast.success("RDV confirmé"))
                                    .catch(() => toast.error("Erreur lors de l'acceptation"));
                                }}
                              >
                                <Check className="mr-1 size-4" /> Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => {
                                  updateRdvStatus(rdv.id, "cancelled")
                                    .then(() => toast.info("RDV refusé"))
                                    .catch(() => toast.error("Erreur lors du refus"));
                                }}
                              >
                                <X className="mr-1 size-4" /> Refuser
                              </Button>
                            </div>
                          )}

                        {rdv.status === "confirmed" &&
                          new Date(rdv.starts_at) > new Date() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs text-red-500 hover:text-red-700"
                              onClick={() => {
                                updateRdvStatus(rdv.id, "cancelled")
                                  .then(() => toast.info("RDV annulé"))
                                  .catch(() => toast.error("Erreur lors de l'annulation"));
                              }}
                            >
                              Annuler
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewRdvDialog
        open={showNewRdv}
        onOpenChange={setShowNewRdv}
        onCreate={createRdv}
      />
    </>
  );
}

function NewRdvDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    destinataireId: string,
    startsAt: string,
    endsAt: string,
    notes?: string,
  ) => Promise<unknown>;
}) {
  const [destinataireId, setDestinataireId] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<
    { id: string; full_name: string | null; company: string | null }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDestinataireId("");
      setDate("");
      setTimeStart("");
      setTimeEnd("");
      setNotes("");
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchContacts = async () => {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, full_name, company")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(20);
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [open, searchQuery]);

  const handleSubmit = async () => {
    if (!destinataireId || !date || !timeStart || !timeEnd) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const startsAt = new Date(`${date}T${timeStart}`).toISOString();
      const endsAt = new Date(`${date}T${timeEnd}`).toISOString();
      await onCreate(destinataireId, startsAt, endsAt, notes || undefined);
      toast.success("Demande de RDV envoyee");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la creation du RDV");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Demander un rendez-vous B2B
          </DialogTitle>
          <DialogDescription>
            Selectionnez un contact et choisissez un creneau horaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDestinataireId("");
              }}
              className="rounded-xl"
            />
            {contacts.length > 0 && !destinataireId && (
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-start rounded-xl px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setDestinataireId(c.id);
                      setSearchQuery(c.full_name || "");
                    }}
                  >
                    <span className="font-medium">
                      {c.full_name || "Contact"}
                    </span>
                    {c.company && (
                      <span className="ml-2 text-muted-foreground">
                        — {c.company}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Heure debut</Label>
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Heure fin</Label>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Sujet du rendez-vous, points a aborder..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl"
          >
            {submitting ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
