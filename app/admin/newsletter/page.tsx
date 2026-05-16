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
import { useTranslation } from '@/lib/i18n';

interface NewsletterEdition {
  id: string;
  titre: string;
  contenu: string | null;
  sent_at: string | null;
  recipient_count: number | null;
}

export default function AdminNewsletterPage() {
  const { t, locale } = useTranslation();
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
      toast.error(t('admin.newsletter.toast_session_error'));
      return;
    }

    if (!form.titre.trim() || !form.contenu.trim()) {
      toast.error(t('admin.newsletter.toast_required'));
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
        throw new Error(payload.error || t('admin.newsletter.toast_send_error'));
      }

      toast.success(
        payload.queued
          ? t('admin.newsletter.toast_queued')
          : t('admin.newsletter.toast_sent', { count: payload.delivered_count })
      );
      setForm({ titre: '', contenu: '', sectors: '' });
      await loadEditions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('admin.newsletter.toast_send_failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          {t('admin.newsletter.title')}
        </p>
        <h1 className="text-4xl text-foreground">{t('admin.newsletter.subtitle')}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {t('admin.newsletter.desc')}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="surface-panel border-0">
          <CardHeader>
            <CardTitle>{t('admin.newsletter.new')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">{t('admin.newsletter.form_title')}</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                placeholder={t('admin.newsletter.form_title_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectors">{t('admin.newsletter.form_sectors')}</Label>
              <Input
                id="sectors"
                value={form.sectors}
                onChange={(event) => setForm((current) => ({ ...current, sectors: event.target.value }))}
                placeholder={t('admin.newsletter.form_sectors_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.newsletter.form_sectors_hint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenu">{t('admin.newsletter.form_content')}</Label>
              <Textarea
                id="contenu"
                rows={10}
                value={form.contenu}
                onChange={(event) => setForm((current) => ({ ...current, contenu: event.target.value }))}
                placeholder={t('admin.newsletter.form_content_placeholder')}
              />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full rounded-xl">
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('admin.newsletter.form_sending')}
                </>
              ) : (
                <>
                  <SendHorizonal className="mr-2 size-4" />
                  {t('admin.newsletter.form_send')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-panel border-0">
          <CardHeader>
            <CardTitle>{t('admin.newsletter.recent')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : editions.length === 0 ? (
              <div className="surface-subtle py-12 text-center">
                <Mail className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('admin.newsletter.no_editions')}</p>
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
                            ? new Date(edition.sent_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : t('admin.newsletter.no_send')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {t('admin.newsletter.recipients', { count: edition.recipient_count || 0 })}
                      </Badge>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {edition.contenu || t('admin.newsletter.no_content')}
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
