'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    company: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError(t('auth.register.required_fields'));
      return;
    }

    if (form.password.length < 8) {
      setError(t('auth.register.password_length'));
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabaseClient.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.full_name.trim(),
          company: form.company.trim() || null,
          role: 'visiteur',
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        setError(t('auth.register.email_exists'));
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setSuccess(true);
    // Redirect after 3 seconds if email is auto-confirmed
    setTimeout(() => {
      router.push('/app');
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md surface-panel border-0">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('auth.register.success')}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                {t('auth.register.success_desc')}
                {t('auth.register.success_hint')}
              </p>
            </div>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <UserPlus className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.register.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.register.subtitle')}
          </p>
        </div>

        <Card className="surface-panel border-0">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('auth.register.full_name')} <span className="text-destructive">*</span></Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={t('auth.register.full_name_placeholder')}
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{t('auth.register.company')}</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder={t('auth.register.company_placeholder')}
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.register.email')} <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.register.email_placeholder')}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.register.password')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.register.password_placeholder')}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('auth.register.creating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 size-4" />
                    {t('auth.register.create')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.register.has_account')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('auth.register.sign_in')}
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground/60">
          {t('auth.register.tos')}
        </p>
      </div>
    </div>
  );
}
