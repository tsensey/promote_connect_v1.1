'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Mail, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SECTORS = [
  'Technology', 'Energy', 'Fashion', 'Healthcare',
  'Construction', 'Agriculture', 'Finance', 'Logistics',
];

const FREQUENCIES = [
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
];

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
}

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: session } = await supabaseClient.auth.getSession();
      if (session.session?.user) {
        setEmail(session.session.user.email || '');
      }

      const { data } = await supabaseClient
        .from('newsletter_editions')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (data) setEditions(data);
    };

    checkSubscription();
  }, []);

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session.session?.access_token) {
        headers.Authorization = `Bearer ${session.session.access_token}`;
      }

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, sectors, frequency }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setIsSubscribed(true);
      toast.success('Inscription reussie !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Newsletter PROMOTE</h1>
              <p className="mt-1 text-muted-foreground">Actualites et opportunites d'affaires reservees aux abonnes.</p>
            </div>
          </div>
        </Card>

        {isSubscribed ? (
          <Card className="p-4 rounded-lg border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <h2 className="font-semibold text-green-900">Vous etes inscrit a la newsletter</h2>
                <p className="text-sm text-green-700">
                  {email} — {FREQUENCIES.find((f) => f.value === frequency)?.label}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-slate-900">Inscription a la newsletter</h2>
            <form onSubmit={handleSubscribe} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Adresse email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Frequence</label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {FREQUENCIES.map((f) => (
                    <Button
                      key={f.value}
                      type="button"
                      variant={frequency === f.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFrequency(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Secteurs d'interet (optionnel)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <Badge
                      key={sector}
                      variant={sectors.includes(sector) ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleSector(sector)}
                    >
                      {sectors.includes(sector) && <Check className="mr-1 h-3 w-3" />}
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                  Inscription reussie ! Verifiez votre boite mail.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </form>
          </Card>
        )}

        <Card className="p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-900">Archives</h2>
          <p className="mt-2 text-muted-foreground">Retrouvez les precedentes editions de la newsletter.</p>

          <div className="mt-4 space-y-3">
            {editions.length > 0 ? (
              editions.map((edition) => (
                <article
                  key={edition.id}
                  className="rounded-lg border border-border bg-muted p-4 transition hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{edition.titre}</h3>
                  {edition.sent_at && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(edition.sent_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  {edition.contenu && (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-3">{edition.contenu}</p>
                  )}
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-muted p-4 text-center">
                <Mail className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-muted-foreground">Aucune edition disponible pour le moment.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
