'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supportHighlights = [
  'Acces reserve a la communaute PROMOTE',
  'Historique reseau et messagerie securisee',
  'Activation des modules selon abonnement',
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
  const registered = searchParams.get('registered') === '1';
  const subscriptionRequired = searchParams.get('subscription') === 'required';

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
      setError(loginError instanceof Error ? loginError.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80">
      <CardHeader className="space-y-5 px-5 pb-4 pt-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/75">
              <ShieldCheck className="size-3.5" />
              Connexion
            </div>
            <CardTitle className="text-3xl leading-tight text-foreground">
              Reprendre votre activite reseau
            </CardTitle>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground">
              Connectez-vous pour retrouver vos conversations, vos rendez-vous B2B et votre espace PROMOTE-CONNECT.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {supportHighlights.map((item) => (
            <div key={item} className="rounded-2xl bg-muted/50 px-3 py-3 text-xs leading-5 text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-7">
        {registered && (
          <Alert className="rounded-2xl border-primary/20 bg-primary/6">
            <AlertDescription>
              Votre compte a bien ete cree. Connectez-vous pour poursuivre votre parcours PROMOTE-CONNECT.
            </AlertDescription>
          </Alert>
        )}

        {subscriptionRequired && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900">
            <AlertDescription>
              Votre abonnement doit etre actif pour acceder aux modules reseau, agenda et messagerie.
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
              <span className="text-xs text-muted-foreground">8 caracteres minimum</span>
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
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
            Les comptes admin sont rediriges automatiquement vers le back-office apres authentification.
          </div>

          <Button type="submit" disabled={loading} size="lg" className="h-12 w-full rounded-2xl text-sm">
            {loading ? 'Connexion en cours...' : 'Se connecter'}
            {!loading && <ArrowRight className="size-4" />}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t border-border/70 px-5 py-5 sm:px-7">
        <div className="flex w-full flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?
          </p>
          <Link href="/register" className="text-sm font-semibold text-primary hover:underline">
            Creer un compte
          </Link>
        </div>
        <Link
          href="mailto:support@promote-connect.com"
          className="w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-center text-sm font-medium text-foreground transition hover:border-primary/25 hover:text-primary"
        >
          Contacter le support pour un acces
        </Link>
      </CardFooter>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="space-y-4 px-5 py-6 sm:px-7">
        <div className="h-14 w-48 animate-pulse rounded-3xl bg-muted" />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
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
