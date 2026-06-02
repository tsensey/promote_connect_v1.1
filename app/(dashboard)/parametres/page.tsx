'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/hooks/useSettings';
import { useBlockedUsers, BLOCK_TYPE_LABELS } from '@/hooks/useBlockedUsers';
import type { BlockType } from '@/hooks/useBlockedUsers';
import { supabaseClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/compress-image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Settings2,
  ChevronRight,
  CalendarClock,
  Mail,
  Rss,
  Volume2,
  Camera,
  Ban,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const TABS = [
  { id: 'profile', icon: User, key: 'settings.profile' },
  { id: 'notifications', icon: Bell, key: 'settings.notifications' },
  { id: 'blocked', icon: Ban, key: 'settings.blocked' },
  { id: 'language', icon: Globe, key: 'settings.language' },
  { id: 'account', icon: Shield, key: 'settings.account' },
] as const;

function ProfileTab() {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const { updateProfile, saving } = useSettings();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const result = await updateProfile({
      full_name: fullName,
      country: country || null,
      avatar_url: avatarUrl,
    });
    if (result.success) {
      await refreshProfile();
      toast.success(t('profile.updated'), { description: t('profile.updated.description') });
    } else {
      toast.error(t('profile.error'), { description: result.error });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;
    const compressed = await compressImage(file);
    const fileExt = compressed.name.split('.').pop();
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, compressed);
    if (uploadError) {
      toast.error(t('profile.error'), { description: uploadError.message });
      return;
    }
    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(urlData.publicUrl);
  };

  const removeAvatar = () => setAvatarUrl(null);

  const hasChanges =
    profile?.full_name !== fullName ||
    profile?.country !== country ||
    profile?.avatar_url !== avatarUrl;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/50 transition-hover:pt-0">
        <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('settings.profile')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative group">
              <Avatar className="size-20 border-2 border-border/50 transition-group-">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-xl font-bold text-muted-foreground bg-muted">
                  {fullName?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                {t('profile.avatar.upload')}
              </Button>
              {avatarUrl && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeAvatar}>
                  {t('profile.avatar.remove')}
                </Button>
              )}
            </div>
          </div>
          <Separator />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <Label htmlFor="fullName">{t('profile.full_name')}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('profile.full_name.placeholder')} />
            </Field>
            <Field>
              <Label htmlFor="country">{t('profile.country')}</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('profile.country.placeholder')} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving} className="min-w-[140px]">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function NotificationsTab() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, saving } = useSettings();

  const toggles: { key: 'notify_messages' | 'notify_rdv' | 'notify_newsletter' | 'notify_feed' | 'notify_sound'; icon: typeof Bell; labelKey: string; descKey: string }[] = [
    { key: 'notify_messages', icon: Bell, labelKey: 'notifications.messages', descKey: 'notifications.messages.description' },
    { key: 'notify_rdv', icon: CalendarClock, labelKey: 'notifications.rdv', descKey: 'notifications.rdv.description' },
    { key: 'notify_newsletter', icon: Mail, labelKey: 'notifications.newsletter', descKey: 'notifications.newsletter.description' },
    { key: 'notify_feed', icon: Rss, labelKey: 'notifications.feed', descKey: 'notifications.feed.description' },
    { key: 'notify_sound', icon: Volume2, labelKey: 'notifications.sound', descKey: 'notifications.sound.description' },
  ];

  const handleToggle = async (key: typeof toggles[number]['key'], checked: boolean) => {
    const result = await updatePreferences({ [key]: checked });
    if (result.success) {
      toast.success(t('notifications.updated'), { description: t('notifications.updated.description') });
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 transition-hover:pt-0">
      <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.notifications')}</CardTitle>
            <CardDescription>{t('settings.notifications.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {toggles.map(({ key, icon: Icon, labelKey, descKey }) => (
          <div
            key={key}
            className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-accent/30 "
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="size-4" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor={key} className="cursor-pointer text-sm font-medium">
                  {t(labelKey)}
                </Label>
                <p className="text-xs text-muted-foreground">{t(descKey)}</p>
              </div>
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

  const languages: { value: Locale; labelKey: string; flag: string; native: string }[] = [
    { value: 'fr', labelKey: 'language.fr', flag: '🇫🇷', native: 'Français' },
    { value: 'en', labelKey: 'language.en', flag: '🇬🇧', native: 'English' },
  ];

  const handleChange = async (newLocale: Locale) => {
    await setLocale(newLocale);
    toast.success(t('language.updated'), { description: t('language.updated.description') });
  };

  return (
    <Card className="overflow-hidden border-border/50 transition-hover:pt-0">
      <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Languages className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.language')}</CardTitle>
            <CardDescription>{t('settings.language.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {languages.map(({ value, labelKey, flag, native }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleChange(value)}
            className={`group relative overflow-hidden rounded-xl border-2 p-5 text-left transition-all ${
              locale === value
                ? 'border-primary bg-primary/5'
                : 'border-border/50 bg-card hover:border-border '
            }`}
          >
            {locale === value && (
              <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary">
                <Check className="size-3.5 text-primary-foreground" />
              </div>
            )}
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-4xl">{flag}</span>
              <div>
                <p className={`text-base font-semibold ${locale === value ? 'text-primary' : ''}`}>
                  {t(labelKey)}
                </p>
                <p className="text-xs text-muted-foreground">{native}</p>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function AccountTab() {
  const { t, locale } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const isExposant = profile?.role === 'exposant';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/50 transition-hover:pt-0">
        <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('settings.account')}</CardTitle>
              <CardDescription>{isExposant ? t('settings.account.description.exposant') : t('settings.account.description.visiteur')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <InfoItem label={t('account.email')} value={user?.email} />
            <InfoItem label={t('account.role')} badge={
              <Badge variant="secondary" className="font-medium">
                {profile?.role === 'exposant' ? t('account.role.exposant') :
                 profile?.role === 'visiteur' ? t('account.role.visiteur') : t('account.role.admin')}
              </Badge>
            } />
            <InfoItem label={t('account.status')} badge={
              <Badge variant={profile?.is_active === false ? 'destructive' : 'default'} className={profile?.is_active !== false ? 'bg-emerald-500/15 text-emerald-700' : ''}>
                {profile?.is_active === false ? 'Suspendu' : 'Actif'}
              </Badge>
            } />
            {memberSince && (
              <InfoItem label={t('account.member_since')} value={memberSince} />
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive/20 py-0">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <LogOut className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium">{t('account.sign_out')}</p>
              <p className="text-xs text-muted-foreground">{t('account.sign_out.confirm')}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleSignOut} className="shrink-0">
            <LogOut className="mr-2 size-4" />
            {t('account.sign_out')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BlockedTab() {
  const { t } = useTranslation();
  const { blockedUsers, loading, loadBlockedUsers, unblockUser, blockUser } = useBlockedUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BlockType>('complete');

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; company: string | null }>>({});

  useEffect(() => {
    if (blockedUsers.length === 0) return;
    const ids = blockedUsers.map(b => b.blocked_id);
    supabaseClient
      .from('profiles')
      .select('id, full_name, company')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, { full_name: string | null; company: string | null }> = {};
          for (const p of data) {
            map[p.id] = { full_name: p.full_name, company: p.company };
          }
          setProfiles(map);
        }
      });
  }, [blockedUsers]);

  const handleUpdateType = async (blockedId: string, blockType: BlockType) => {
    const blocked = blockedUsers.find(b => b.blocked_id === blockedId);
    if (!blocked) return;
    await blockUser(blockedId, blocked.reason, blockType);
    setEditingId(null);
  };

  const handleUnblock = async (blockedId: string) => {
    await unblockUser(blockedId);
    toast.success(t('blocked.unblocked'));
  };

  const filtered = searchTerm
    ? blockedUsers.filter(b => {
        const p = profiles[b.blocked_id];
        return p?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               p?.company?.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : blockedUsers;

  return (
    <Card className="overflow-hidden border-border/50">
      <div className="h-1.5 bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
            <Ban className="size-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.blocked')}</CardTitle>
            <CardDescription>{t('settings.blocked.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder={t('blocked.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && blockedUsers.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('blocked.empty')}</p>
        )}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((b) => {
              const profile = profiles[b.blocked_id];
              return (
                <div key={b.blocked_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{profile?.full_name || b.blocked_id.slice(0, 8)}</p>
                    {profile?.company && (
                      <p className="truncate text-xs text-muted-foreground">{profile.company}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === b.blocked_id ? (
                      <select
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                        value={selectedType}
                        onChange={(e) => {
                          const val = e.target.value as BlockType;
                          setSelectedType(val);
                          handleUpdateType(b.blocked_id, val);
                        }}
                        autoFocus
                        onBlur={() => setEditingId(null)}
                      >
                        {Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md border border-border/50 px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        onClick={() => { setEditingId(b.blocked_id); setSelectedType(b.block_type); }}
                      >
                        {BLOCK_TYPE_LABELS[b.block_type]}
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleUnblock(b.blocked_id)}
                    >
                      {t('blocked.unblock')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, badge }: { label: string; value?: string | null; badge?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {badge || <p className="text-sm font-medium">{value || '—'}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-primary/20">
            <Settings2 className="size-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card p-1.5 lg:w-56 lg:flex-col">
          {TABS.map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate lg:inline">{t(key)}</span>
              <ChevronRight className={`ml-auto size-3.5 shrink-0 opacity-0 transition-opacity lg:block ${activeTab === id ? 'opacity-100' : ''}`} />
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <div className={`transition-opacity duration-200 ${activeTab === 'profile' ? 'opacity-100' : 'hidden'}`}>
            <ProfileTab />
          </div>
          <div className={`transition-opacity duration-200 ${activeTab === 'notifications' ? 'opacity-100' : 'hidden'}`}>
            <NotificationsTab />
          </div>
          <div className={`transition-opacity duration-200 ${activeTab === 'blocked' ? 'opacity-100' : 'hidden'}`}>
            <BlockedTab />
          </div>
          <div className={`transition-opacity duration-200 ${activeTab === 'language' ? 'opacity-100' : 'hidden'}`}>
            <LanguageTab />
          </div>
          <div className={`transition-opacity duration-200 ${activeTab === 'account' ? 'opacity-100' : 'hidden'}`}>
            <AccountTab />
          </div>
        </div>
      </div>
    </div>
  );
}
