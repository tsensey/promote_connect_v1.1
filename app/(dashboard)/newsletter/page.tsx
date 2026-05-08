"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Mail, Check, Loader2, Newspaper, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SECTORS = [
  "Technology",
  "Energy",
  "Fashion",
  "Healthcare",
  "Construction",
  "Agriculture",
  "Finance",
  "Logistics",
];

const FREQUENCIES = [
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
];

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
}

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: session } = await supabaseClient.auth.getSession();
      if (session.session?.user) {
        setEmail(session.session.user.email || "");
      }

      const { data } = await supabaseClient
        .from("newsletter_editions")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(10);

      if (data) setEditions(data);
    };

    checkSubscription();
  }, []);

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector],
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session.session?.access_token) {
        headers.Authorization = `Bearer ${session.session.access_token}`;
      }

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({ email, sectors, frequency }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to subscribe");
      }

      setSuccess(true);
      setIsSubscribed(true);
      toast.success("Inscription reussie !");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
          Module communication
        </p>
        <h1 className="text-3xl font-heading text-foreground">
          Newsletter PROMOTE
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Actualites et opportunites d&apos;affaires pour tous les comptes
          actifs.
        </p>
      </div>

      {isSubscribed ? (
        <Card className="surface-panel overflow-hidden border-0">
          <div className="brand-gradient px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                <Check className="size-5 text-white" />
              </div>
              <div className="text-white">
                <h2 className="font-heading text-lg font-semibold">
                  Vous etes inscrit a la newsletter
                </h2>
                <p className="text-sm text-white/80">
                  {email} —{" "}
                  {FREQUENCIES.find((f) => f.value === frequency)?.label}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="surface-panel border-0">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Abonnement
                </p>
                <h2 className="text-2xl font-heading text-foreground">
                  Inscription a la newsletter
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Adresse email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="h-11 rounded-xl border-border/70 bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Frequence
                </label>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCIES.map((f) => (
                    <Button
                      key={f.value}
                      type="button"
                      variant={frequency === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequency(f.value)}
                      className="rounded-full"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Secteurs d&apos;interet (optionnel)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <Badge
                      key={sector}
                      variant={
                        sectors.includes(sector) ? "default" : "secondary"
                      }
                      className="cursor-pointer rounded-full transition-all hover:opacity-80"
                      onClick={() => toggleSector(sector)}
                    >
                      {sectors.includes(sector) && (
                        <Check className="mr-1 size-3" />
                      )}
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Inscription reussie ! Verifiez votre boite mail.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="surface-panel border-0">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Newspaper className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Archives
              </p>
              <h2 className="text-2xl font-heading text-foreground">
                Editions precedentes
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {editions.length > 0 ? (
              editions.map((edition) => (
                <article
                  key={edition.id}
                  className="rounded-xl border border-border/60 bg-white/80 p-5 transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {edition.titre}
                      </h3>
                      {edition.sent_at && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          {new Date(edition.sent_at).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {edition.contenu && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {edition.contenu}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Mail className="size-12 text-muted-foreground/30" />
                <p className="text-base font-medium text-foreground">
                  Aucune edition disponible
                </p>
                <p className="text-sm text-muted-foreground">
                  Les newsletters seront archivees ici des leur publication.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
