'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, SendHorizonal } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
  recipient_count: number | null;
}

export default function AdminNewsletterPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    sectors: '',
  });

  const loadEditions = async () => {
    const { data } = await supabaseClient
      .from('newsletter_editions')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(12);

    setEditions((data || []) as NewsletterEdition[]);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data } = await supabaseClient
        .from('newsletter_editions')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(12);

      if (!active) {
        return;
      }

      setEditions((data || []) as NewsletterEdition[]);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const handleSend = async () => {
    if (!session?.access_token) {
      toast.error('Session administrateur introuvable.');
      return;
    }

    if (!form.titre.trim() || !form.contenu.trim()) {
      toast.error('Le titre et le contenu sont requis.');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          titre: form.titre,
          contenu: form.contenu,
          sectors: form.sectors
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Envoi impossible.');
      }

      toast.success(
        payload.queued
          ? 'Edition enregistree. Aucun envoi email n a ete effectue.'
          : `Newsletter envoyee a ${payload.delivered_count} destinataires.`
      );
      setForm({ titre: '', contenu: '', sectors: '' });
      await loadEditions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l envoi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          Administration newsletter
        </p>
        <h1 className="text-4xl text-foreground">Composer et archiver les editions</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Diffusez les actualites PROMOTE-CONNECT, segmentees par secteurs si besoin, et conservez l historique dans l espace membre.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="surface-panel border-0">
          <CardHeader>
            <CardTitle>Nouvelle edition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                placeholder="Opportunites business de la semaine"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectors">Secteurs cibles</Label>
              <Input
                id="sectors"
                value={form.sectors}
                onChange={(event) => setForm((current) => ({ ...current, sectors: event.target.value }))}
                placeholder="Agriculture, Energie, Fintech"
              />
              <p className="text-xs text-muted-foreground">
                Separez les secteurs par des virgules. Laissez vide pour toute la base active.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenu">Contenu</Label>
              <Textarea
                id="contenu"
                rows={10}
                value={form.contenu}
                onChange={(event) => setForm((current) => ({ ...current, contenu: event.target.value }))}
                placeholder="Actualites, rendez-vous a ne pas manquer, nouveaux exposants, offres du moment..."
              />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full rounded-2xl">
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <SendHorizonal className="mr-2 size-4" />
                  Enregistrer et envoyer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardHeader>
            <CardTitle>Dernieres editions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : editions.length === 0 ? (
              <div className="surface-subtle py-12 text-center">
                <Mail className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune edition envoyee pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {editions.map((edition) => (
                  <article key={edition.id} className="surface-subtle space-y-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl text-foreground">{edition.titre}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {edition.sent_at
                            ? new Date(edition.sent_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Edition archivee sans envoi email'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {edition.recipient_count || 0} destinataire{edition.recipient_count && edition.recipient_count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {edition.contenu || 'Contenu non disponible.'}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
