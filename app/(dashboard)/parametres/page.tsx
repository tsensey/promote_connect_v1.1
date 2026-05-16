'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/hooks/useSettings';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Globe,
  Shield,
  Save,
  LogOut,
  Loader2,
  Check,
  Languages,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const SECTORS = [
  'agriculture',
  'agroalimentaire',
  'artisanat',
  'banque_assurance',
  'batiment',
  'chimie',
  'commerce',
  'communication',
  'education',
  'energie',
  'environnement',
  'finance',
  'industrie',
  'it',
  'logistique',
  'sante',
  'services',
  'tourisme',
] as const;

function ProfileTab() {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const { updateProfile, saving } = useSettings();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [sector, setSector] = useState(profile?.sector ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [pavillon, setPavillon] = useState(profile?.pavillon ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const result = await updateProfile({
      full_name: fullName,
      company,
      sector: sector || null,
      country: country || null,
      pavillon: pavillon || null,
      avatar_url: avatarUrl,
    });

    if (result.success) {
      await refreshProfile();
      toast.success(t('profile.updated'), {
        description: t('profile.updated.description'),
      });
    } else {
      toast.error(t('profile.error'), {
        description: result.error,
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast.error(t('profile.error'), { description: uploadError.message });
      return;
    }

    const { data: urlData } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setAvatarUrl(urlData.publicUrl);
  };

  const removeAvatar = () => setAvatarUrl(null);

  const hasChanges =
    profile?.full_name !== fullName ||
    profile?.company !== company ||
    profile?.sector !== sector ||
    profile?.country !== country ||
    profile?.pavillon !== pavillon ||
    profile?.avatar_url !== avatarUrl;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-4" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-border/50">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg font-semibold text-muted-foreground bg-muted">
                {fullName?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('profile.avatar.upload')}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={removeAvatar}
                >
                  {t('profile.avatar.remove')}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('profile.full_name')}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('profile.full_name.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t('profile.company')}</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('profile.company.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">{t('profile.sector')}</Label>
              <Select value={sector} onValueChange={(value: string | null) => setSector(value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('profile.sector.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`sector.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('profile.country')}</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t('profile.country.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pavillon">{t('profile.pavillon')}</Label>
              <Input
                id="pavillon"
                value={pavillon}
                onChange={(e) => setPavillon(e.target.value)}
                placeholder={t('profile.pavillon.placeholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, saving } = useSettings();

  const toggles: {
    key: 'notify_messages' | 'notify_rdv' | 'notify_newsletter' | 'notify_feed' | 'notify_sound';
    labelKey: string;
    descKey: string;
  }[] = [
    { key: 'notify_messages', labelKey: 'notifications.messages', descKey: 'notifications.messages.description' },
    { key: 'notify_rdv', labelKey: 'notifications.rdv', descKey: 'notifications.rdv.description' },
    { key: 'notify_newsletter', labelKey: 'notifications.newsletter', descKey: 'notifications.newsletter.description' },
    { key: 'notify_feed', labelKey: 'notifications.feed', descKey: 'notifications.feed.description' },
    { key: 'notify_sound', labelKey: 'notifications.sound', descKey: 'notifications.sound.description' },
  ];

  const handleToggle = async (key: typeof toggles[number]['key'], checked: boolean) => {
    const result = await updatePreferences({ [key]: checked });
    if (result.success) {
      toast.success(t('notifications.updated'), {
        description: t('notifications.updated.description'),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="size-4" />
          {t('settings.notifications')}
        </CardTitle>
        <CardDescription>{t('settings.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map(({ key, labelKey, descKey }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-colors hover:bg-accent/30"
          >
            <div className="space-y-0.5">
              <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                {t(labelKey)}
              </Label>
              <p className="text-xs text-muted-foreground">{t(descKey)}</p>
            </div>
            <Switch
              id={key}
              checked={preferences?.[key] ?? true}
              disabled={saving}
              onCheckedChange={(checked) => handleToggle(key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LanguageTab() {
  const { t, locale, setLocale } = useTranslation();

  const languages: { value: Locale; labelKey: string; flag: string }[] = [
    { value: 'fr', labelKey: 'language.fr', flag: '🇫🇷' },
    { value: 'en', labelKey: 'language.en', flag: '🇬🇧' },
  ];

  const handleChange = async (newLocale: Locale) => {
    await setLocale(newLocale);
    toast.success(t('language.updated'), {
      description: t('language.updated.description'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Languages className="size-4" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>{t('settings.language.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {languages.map(({ value, labelKey, flag }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleChange(value)}
            className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
              locale === value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border/50 hover:border-border hover:bg-accent/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{flag}</span>
              <span className={`text-sm font-medium ${locale === value ? 'text-primary' : ''}`}>
                {t(labelKey)}
              </span>
            </div>
            {locale === value && (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                <Check className="size-3.5 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function AccountTab() {
  const { t, locale } = useTranslation();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const statusLabel = (status: string | null | undefined) => {
    if (!status || status === 'none') return t('account.subscription.none');
    return t(`account.subscription.${status}`);
  };

  const statusBadge = (status: string | null | undefined) => {
    if (!status || status === 'none' || status === 'expired') return 'destructive' as const;
    if (status === 'trial') return 'secondary' as const;
    return 'default' as const;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-4" />
            {t('settings.account')}
          </CardTitle>
          <CardDescription>{t('settings.account.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('account.email')}</p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('account.role')}</p>
              <Badge variant="secondary" className="font-medium">
                {profile?.role === 'exposant'
                  ? t('account.role.exposant')
                  : profile?.role === 'visiteur'
                    ? t('account.role.visiteur')
                    : t('account.role.admin')}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('account.subscription')}</p>
              <Badge variant={statusBadge(profile?.subscription_status)}>
                {statusLabel(profile?.subscription_status)}
              </Badge>
            </div>
            {profile?.subscription_ends_at && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('account.subscription.ends_at')}</p>
                <p className="text-sm">
                  {new Date(profile.subscription_ends_at).toLocaleDateString(
                    locale === 'en' ? 'en-US' : 'fr-FR',
                    { day: 'numeric', month: 'long', year: 'numeric' }
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <LogOut className="size-4 text-destructive" />
            <div>
              <p className="text-sm font-medium">{t('account.sign_out')}</p>
              <p className="text-xs text-muted-foreground">{t('account.sign_out.confirm')}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            {t('account.sign_out')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 flex flex-col">
        <TabsList className="w-full justify-start gap-0 border-b border-border/50 bg-transparent p-0">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <User className="size-4" />
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Bell className="size-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger
            value="language"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Globe className="size-4" />
            {t('settings.language')}
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Shield className="size-4" />
            {t('settings.account')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="language">
          <LanguageTab />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
