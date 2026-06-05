'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PlatformConfig {
  key: string;
  value: any;
  description: string;
}

export default function ConfigurationPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Valeurs de formulaire
  const [quotas, setQuotas] = useState({
    daily_message_limit: 10,
    total_message_limit: 100,
    max_posts_free_trial: 2,
    max_vitrine_offers_free_trial: 2,
    trial_duration_days: 30,
    sponsored_weight_ratio: 3,
    sponsored_top_count: 3,
    discover_mode_refresh_interval_minutes: 30,
    auto_suspend_report_threshold: 3,
    subscription_price_xof: 100000,
  });

  const [conversionMessage, setConversionMessage] = useState({
    title: '',
    body: '',
    price_display: '',
    phone: '',
    email: '',
    cta_url: '',
    cta_label: '',
  });

  useEffect(() => {
    async function loadConfig() {
      const { data, error } = await supabaseClient
        .from('platform_config')
        .select('*');

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setConfigs(data as unknown as PlatformConfig[] || []);

      const newQuotas = { ...quotas };
      let newConvMsg = { ...conversionMessage };

      data?.forEach((item) => {
        if (item.key === 'conversion_message') {
          newConvMsg = { ...newConvMsg, ...(item.value as Record<string, string>) };
        } else if (item.key in newQuotas) {
          (newQuotas as any)[item.key] = Number(item.value);
        }
      });

      setQuotas(newQuotas);
      setConversionMessage(newConvMsg);
      setLoading(false);
    }

    loadConfig();
  }, []);

  const handleSaveQuota = async (key: string, value: number) => {
    setSaving(key);
    setError(null);
    
    const { error } = await supabaseClient
      .from('platform_config')
      .update({ value: Number(value) })
      .eq('key', key);
      
    if (error) setError(error.message);
    setSaving(null);
  };

  const handleSaveConversionMessage = async () => {
    setSaving('conversion_message');
    setError(null);
    
    const { error } = await supabaseClient
      .from('platform_config')
      .update({ value: conversionMessage })
      .eq('key', 'conversion_message');
      
    if (error) setError(error.message);
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-reveal">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.configuration.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('admin.configuration.desc')}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Section Quotas Free Trial */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">{t('admin.configuration.section_quotas')}</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.configuration.label_daily_messages')}</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quotas.daily_message_limit}
                  onChange={(e) => setQuotas({...quotas, daily_message_limit: parseInt(e.target.value) || 0})}
                />
                <Button 
                  onClick={() => handleSaveQuota('daily_message_limit', quotas.daily_message_limit)}
                  disabled={saving === 'daily_message_limit'}
                >
                  {saving === 'daily_message_limit' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.configuration.label_total_messages')}</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quotas.total_message_limit}
                  onChange={(e) => setQuotas({...quotas, total_message_limit: parseInt(e.target.value) || 0})}
                />
                <Button 
                  onClick={() => handleSaveQuota('total_message_limit', quotas.total_message_limit)}
                  disabled={saving === 'total_message_limit'}
                >
                  {saving === 'total_message_limit' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.configuration.label_max_posts')}</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quotas.max_posts_free_trial}
                  onChange={(e) => setQuotas({...quotas, max_posts_free_trial: parseInt(e.target.value) || 0})}
                />
                <Button 
                  onClick={() => handleSaveQuota('max_posts_free_trial', quotas.max_posts_free_trial)}
                  disabled={saving === 'max_posts_free_trial'}
                >
                  {saving === 'max_posts_free_trial' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.configuration.label_max_offers')}</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quotas.max_vitrine_offers_free_trial}
                  onChange={(e) => setQuotas({...quotas, max_vitrine_offers_free_trial: parseInt(e.target.value) || 0})}
                />
                <Button 
                  onClick={() => handleSaveQuota('max_vitrine_offers_free_trial', quotas.max_vitrine_offers_free_trial)}
                  disabled={saving === 'max_vitrine_offers_free_trial'}
                >
                  {saving === 'max_vitrine_offers_free_trial' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.configuration.label_trial_duration')}</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={quotas.trial_duration_days}
                  onChange={(e) => setQuotas({...quotas, trial_duration_days: parseInt(e.target.value) || 0})}
                />
                <Button 
                  onClick={() => handleSaveQuota('trial_duration_days', quotas.trial_duration_days)}
                  disabled={saving === 'trial_duration_days'}
                >
                  {saving === 'trial_duration_days' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Feed & Admin */}
        <div className="space-y-8">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.configuration.section_feed')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('admin.configuration.label_sponsored_weight')}</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={quotas.sponsored_weight_ratio}
                    onChange={(e) => setQuotas({...quotas, sponsored_weight_ratio: parseInt(e.target.value) || 0})}
                  />
                  <Button 
                    onClick={() => handleSaveQuota('sponsored_weight_ratio', quotas.sponsored_weight_ratio)}
                    disabled={saving === 'sponsored_weight_ratio'}
                  >
                    {saving === 'sponsored_weight_ratio' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.configuration.label_sponsored_top')}</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={quotas.sponsored_top_count}
                    onChange={(e) => setQuotas({...quotas, sponsored_top_count: parseInt(e.target.value) || 0})}
                  />
                  <Button 
                    onClick={() => handleSaveQuota('sponsored_top_count', quotas.sponsored_top_count)}
                    disabled={saving === 'sponsored_top_count'}
                  >
                    {saving === 'sponsored_top_count' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.configuration.section_moderation')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('admin.configuration.label_report_threshold')}</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={quotas.auto_suspend_report_threshold}
                    onChange={(e) => setQuotas({...quotas, auto_suspend_report_threshold: parseInt(e.target.value) || 0})}
                  />
                  <Button 
                    onClick={() => handleSaveQuota('auto_suspend_report_threshold', quotas.auto_suspend_report_threshold)}
                    disabled={saving === 'auto_suspend_report_threshold'}
                  >
                    {saving === 'auto_suspend_report_threshold' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.configuration.label_subscription_price')}</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={quotas.subscription_price_xof}
                    onChange={(e) => setQuotas({...quotas, subscription_price_xof: parseInt(e.target.value) || 0})}
                  />
                  <Button 
                    onClick={() => handleSaveQuota('subscription_price_xof', quotas.subscription_price_xof)}
                    disabled={saving === 'subscription_price_xof'}
                  >
                    {saving === 'subscription_price_xof' ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message de conversion */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('admin.configuration.section_conversion')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>{t('admin.configuration.label_title')}</Label>
            <Input 
              value={conversionMessage.title} 
              onChange={(e) => setConversionMessage({...conversionMessage, title: e.target.value})} 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('admin.configuration.label_description')}</Label>
            <Textarea 
              rows={3} 
              value={conversionMessage.body} 
              onChange={(e) => setConversionMessage({...conversionMessage, body: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.configuration.label_price_display')}</Label>
            <Input 
              value={conversionMessage.price_display} 
              onChange={(e) => setConversionMessage({...conversionMessage, price_display: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.configuration.label_cta_label')}</Label>
            <Input 
              value={conversionMessage.cta_label} 
              onChange={(e) => setConversionMessage({...conversionMessage, cta_label: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.configuration.label_phone')}</Label>
            <Input 
              value={conversionMessage.phone} 
              onChange={(e) => setConversionMessage({...conversionMessage, phone: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.configuration.label_email')}</Label>
            <Input 
              value={conversionMessage.email} 
              onChange={(e) => setConversionMessage({...conversionMessage, email: e.target.value})} 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('admin.configuration.label_cta_url')}</Label>
            <Input 
              value={conversionMessage.cta_url || ''} 
              placeholder="https://..."
              onChange={(e) => setConversionMessage({...conversionMessage, cta_url: e.target.value})} 
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSaveConversionMessage}
            disabled={saving === 'conversion_message'}
            className="w-full sm:w-auto"
          >
            {saving === 'conversion_message' && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('admin.configuration.save_conversion')}
          </Button>
        </div>
      </div>
    </div>
  );
}
