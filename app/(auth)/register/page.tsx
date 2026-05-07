'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SignupRole = 'visiteur' | 'exposant';

const advantages = [
  'Acces au reseau professionnel du salon',
  'Agenda et rendez-vous B2B centralises',
  'Visibilite vitrine pour les exposants',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    company: '',
    sector: '',
    country: '',
    pavillon: '',
    role: 'visiteur' as SignupRole,
    consent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.consent) {
      setError('Vous devez accepter le traitement de vos donnees pour creer votre compte.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: form.role,
            company: form.company || null,
            sector: form.sector || null,
            country: form.country || null,
            pavillon: form.pavillon || null,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.replace('/abonnement?welcome=1');
        return;
      }

      router.replace('/login?registered=1');
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : 'Impossible de creer le compte pour le moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80">
      <CardHeader className="space-y-5 px-5 pb-4 pt-6 sm:px-7">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/75">
            <Sparkles className="size-3.5" />
            Inscription
          </div>
          <CardTitle className="text-3xl leading-tight text-foreground">
            Creer votre acces PROMOTE-CONNECT
          </CardTitle>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Configurez votre profil, choisissez votre role et activez ensuite votre parcours reseau sur 12 mois.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {advantages.map((item) => (
            <div key={item} className="rounded-2xl bg-muted/50 px-3 py-3 text-xs leading-5 text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-7">
        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nom complet</Label>
              <Input
                id="full-name"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                required
                placeholder="Jean Dupont"
                className="h-12 rounded-2xl border-border/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                placeholder="jean@entreprise.com"
                className="h-12 rounded-2xl border-border/70"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                  minLength={8}
                  placeholder="8 caracteres minimum"
                  className="h-12 rounded-2xl border-border/70 pr-12"
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
            <div className="space-y-2">
              <Label htmlFor="pavillon">Pavillon</Label>
              <Input
                id="pavillon"
                value={form.pavillon}
                onChange={(event) => setForm((current) => ({ ...current, pavillon: event.target.value }))}
                placeholder="A"
                className="h-12 rounded-2xl border-border/70"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="company"
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                placeholder="Nom de votre entreprise"
                className="h-12 rounded-2xl border-border/70 pl-11"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur</Label>
              <Input
                id="sector"
                value={form.sector}
                onChange={(event) => setForm((current) => ({ ...current, sector: event.target.value }))}
                placeholder="Agroalimentaire"
                className="h-12 rounded-2xl border-border/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="country"
                  value={form.country}
                  onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                  placeholder="Cameroun"
                  className="h-12 rounded-2xl border-border/70 pl-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Je m inscris comme</Label>
              <span className="text-xs text-muted-foreground">Ce choix structure votre experience</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-[26px] border p-4 text-left transition ${
                  form.role === 'visiteur'
                    ? 'border-primary bg-primary/6 shadow-[0_20px_50px_-36px_rgba(145,36,80,0.45)]'
                    : 'border-border bg-background hover:border-primary/30'
                }`}
                onClick={() => setForm((current) => ({ ...current, role: 'visiteur' }))}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Visiteur</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Trouver les bons exposants, dialoguer vite et organiser votre agenda salon.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`rounded-[26px] border p-4 text-left transition ${
                  form.role === 'exposant'
                    ? 'border-primary bg-primary/6 shadow-[0_20px_50px_-36px_rgba(145,36,80,0.45)]'
                    : 'border-border bg-background hover:border-primary/30'
                }`}
                onClick={() => setForm((current) => ({ ...current, role: 'exposant' }))}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Exposant</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Publier votre vitrine, recevoir des contacts qualifies et prolonger votre ROI salon.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-4 text-sm">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
              className="mt-1 size-4 rounded border-border"
            />
            <span className="leading-6 text-muted-foreground">
              J accepte le traitement de mes donnees dans le cadre de PROMOTE-CONNECT, conformement aux exigences RGPD.
            </span>
          </label>

          <div className="rounded-2xl border border-primary/12 bg-primary/6 p-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <p className="leading-6 text-muted-foreground">
                Le compte est cree immediatement. L acces aux modules reseau depend ensuite de l activation ou du renouvellement de l abonnement.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={loading} size="lg" className="h-12 w-full rounded-2xl text-sm">
            {loading ? 'Creation du compte...' : 'Creer mon compte'}
            {!loading && <ArrowRight className="size-4" />}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t border-border/70 px-5 py-5 sm:px-7">
        <div className="flex w-full flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
            <ShieldCheck className="size-4 text-primary" />
            Securise par Supabase Auth
          </div>
          <p className="text-sm text-muted-foreground">
            Deja membre ?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </CardFooter>
    </div>
  );
}
