'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

function LoginPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const adminOnly = searchParams.get('admin_only') === '1';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);

      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.replace(redirect);
        return;
      }

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        throw new Error(t('auth.login.error'));
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (profile as { role: string | null } | null)?.role;
      const redirectPath = role === 'admin' ? '/admin' : '/feed';
      router.replace(redirectPath);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : t('auth.login.error'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="surface-card p-6 sm:p-10 space-y-8 animate-reveal">
        <div className="flex justify-center mb-2">
          <Image
            src="/logo-promote.png"
            alt="PROMOTE-CONNECT Logo"
            width={120}
            height={40}
            className="object-contain rounded-full shadow-md"
          />
        </div>
        <div className="space-y-2 text-center animate-reveal-delay-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {t('auth.login.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {adminOnly && (
          <Alert className="rounded-2xl border-primary/20 bg-primary/5 text-primary animate-reveal-delay-1">
            <AlertDescription>
              {t('auth.login.restricted')}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-2xl animate-reveal-delay-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-reveal-delay-2">
          <div className="space-y-3">
            <Label htmlFor="email" className="font-semibold">{t('auth.login.email')}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder={t('auth.login.email_placeholder')}
                className="pl-12 h-12 rounded-xl bg-background/50 focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className="font-semibold">{t('auth.login.password')}</Label>
              <span className="text-xs text-muted-foreground">
                {t('auth.login.password_hint')}
              </span>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder={t('auth.login.password_placeholder')}
                className="pl-12 pr-12 h-12 rounded-xl bg-background/50 focus-visible:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={
                  showPassword
                    ? t('auth.login.hide_password')
                    : t('auth.login.show_password')
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? t('auth.login.logging_in') : t('auth.login.sign_in')}
            {!loading && <ArrowRight className="ml-2 size-4" />}
          </Button>
        </form>
        <div className="flex flex-col gap-4 pt-4 animate-reveal-delay-2">
          <Link
            href="mailto:support@promote-connect.com"
            className="text-center text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            {t('auth.login.no_access')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="flex justify-center mb-6">
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2 text-center">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mx-auto" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted mx-auto" />
      </div>
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
