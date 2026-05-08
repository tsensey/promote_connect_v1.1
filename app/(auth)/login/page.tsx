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
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supportHighlights = [
  'Acces reserve a la communaute PROMOTE',
  'Historique reseau et messagerie securisee',
  'Comptes crees uniquement par l administrateur',
];

function LoginPageContent() {
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
        throw new Error('Session introuvable apres la connexion.');
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (profile as { role: string | null } | null)?.role;
      router.replace(role === 'admin' ? '/admin' : '/app');
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Erreur de connexion',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="surface-panel w-full max-w-lg border-0 shadow-xl">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/75">
            <ShieldCheck className="size-3.5" />
            Connexion
          </div>
          <h1 className="font-heading text-2xl leading-tight text-foreground sm:text-3xl">
            Acceder a votre espace PROMOTE-CONNECT
          </h1>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground">
            Connectez-vous avec les identifiants transmis par l administrateur
            pour acceder a toutes les fonctionnalites de la plateforme.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {supportHighlights.map((item) => (
            <div
              key={item}
              className="surface-subtle px-3 py-3 text-xs leading-5 text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>

        {adminOnly && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900">
            <AlertDescription>
              La creation de compte est reservee a l administrateur. Contactez
              l equipe PROMOTE pour recevoir vos identifiants par email.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="prenom.nom@entreprise.com"
                className="h-12 rounded-2xl border-border/70 bg-background pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <span className="text-xs text-muted-foreground">
                8 caracteres minimum
              </span>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Votre mot de passe temporaire ou personnel"
                className="h-12 rounded-2xl border-border/70 bg-background pl-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
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

          <div className="surface-subtle px-4 py-3 text-sm text-muted-foreground">
            Les comptes admin sont rediriges automatiquement vers le back-office
            apres authentification.
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="h-12 w-full rounded-2xl text-sm"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
            {!loading && <ArrowRight className="size-4" />}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border/60 px-6 pb-6 pt-5 sm:px-8">
        <div className="w-full rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
          Aucun compte ne peut etre cree depuis cette page. Les acces sont
          provisionnes par l administrateur PROMOTE-CONNECT.
        </div>
        <Link
          href="mailto:support@promote-connect.com"
          className="w-full rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-center text-sm font-medium text-foreground transition hover:border-primary/30 hover:text-primary"
        >
          Contacter le support pour recevoir un acces
        </Link>
      </CardFooter>
    </Card>
  );
}

function LoginSkeleton() {
  return (
    <Card className="surface-panel w-full max-w-lg border-0">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="h-6 w-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="h-14 animate-pulse rounded-2xl bg-muted" />
          <div className="h-14 animate-pulse rounded-2xl bg-muted" />
          <div className="h-14 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
