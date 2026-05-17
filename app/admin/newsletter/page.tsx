'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, SendHorizonal, Eye, Archive, Users, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [showPreview, setShowPreview] = useState(false);
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
      if (!active) return;
      setEditions((data || []) as NewsletterEdition[]);
      setLoading(false);
    };
    void bootstrap();
    return () => { active = false; };
  }, []);

  const handleSend = async () => {
    if (!session?.access_token) {
      toast.error(t('admin.newsletter.no_session'));
      return;
    }

    if (!form.titre.trim() || !form.contenu.trim()) {
      toast.error(t('admin.newsletter.validation'));
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
        throw new Error(payload.error || t('admin.newsletter.send_error'));
      }

      toast.success(
        payload.queued
          ? t('admin.newsletter.saved_no_email')
          : t('admin.newsletter.sent', { count: payload.delivered_count })
      );
      setForm({ titre: '', contenu: '', sectors: '' });
      setShowPreview(false);
      await loadEditions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('admin.newsletter.send_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600/80">
          {t('admin.newsletter.section_label')}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10">
            <Mail className="size-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              {t('admin.newsletter.subtitle')}
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl">
              {t('admin.newsletter.desc')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[480px_minmax(0,1fr)]">
        {/* Compose Panel */}
        <div className="space-y-4">
          <Card className="surface-panel border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <SendHorizonal className="size-4 text-primary" />
                  </div>
                  <CardTitle>{t('admin.newsletter.new')}</CardTitle>
                </div>
                {form.titre && form.contenu && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-2"
                  >
                    <Eye className="size-4" />
                    {t('admin.newsletter.preview_btn')}
                  </Button>
                )}
              </div>
              <CardDescription>
                {t('admin.newsletter.create_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">{t('admin.newsletter.form_title')}</Label>
                <Input
                  id="titre"
                  value={form.titre}
                  onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                  placeholder={t('admin.newsletter.form_title_placeholder')}
                  className="h-11 rounded-xl border-border/70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectors">{t('admin.newsletter.form_sectors')}</Label>
                <Input
                  id="sectors"
                  value={form.sectors}
                  onChange={(event) => setForm((current) => ({ ...current, sectors: event.target.value }))}
                  placeholder={t('admin.newsletter.form_sectors_placeholder')}
                  className="h-11 rounded-xl border-border/70"
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.newsletter.form_sectors_hint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenu">{t('admin.newsletter.form_content')}</Label>
                <Textarea
                  id="contenu"
                  rows={12}
                  value={form.contenu}
                  onChange={(event) => setForm((current) => ({ ...current, contenu: event.target.value }))}
                  placeholder={t('admin.newsletter.form_content_placeholder')}
                  className="rounded-xl border-border/70 resize-y min-h-[200px]"
                />
              </div>

              {showPreview && form.contenu && (
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.newsletter.preview_title')}</p>
                  <div className="rounded-lg bg-white dark:bg-card p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">{t('admin.newsletter.preview_subject')} <span className="font-medium text-foreground">{form.titre}</span></p>
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {form.contenu}
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSend} disabled={sending} className="w-full rounded-xl h-11">
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
        </div>

        {/* Editions History */}
        <Card className="surface-panel border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Archive className="size-4 text-primary" />
              </div>
              <CardTitle>{t('admin.newsletter.recent')}</CardTitle>
            </div>
            <CardDescription>
              {t('admin.newsletter.history_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : editions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                  <Mail className="size-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">
                    {t('admin.newsletter.no_editions')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('admin.newsletter.empty_desc')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {editions.map((edition) => (
                  <article
                    key={edition.id}
                    className="group rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {edition.titre}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          {edition.sent_at ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="size-3.5" />
                              {new Date(edition.sent_at).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'fr-FR',
                                { day: 'numeric', month: 'long', year: 'numeric' }
                              )}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs rounded-full text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                              {t('admin.newsletter.draft_badge')}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" />
                            {t('admin.newsletter.recipients', { count: edition.recipient_count || 0 })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    {edition.contenu && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground border-t border-border/40 pt-3">
                        {edition.contenu}
                      </p>
                    )}
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
