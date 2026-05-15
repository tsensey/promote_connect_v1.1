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

export default function RegisterPage() {
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
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
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
        setError('Un compte existe déjà avec cet email. Veuillez vous connecter.');
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
              <h1 className="text-2xl font-bold text-foreground">Compte créé !</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                Bienvenue sur PROMOTE-CONNECT. Un email de confirmation vous a été envoyé.
                Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
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
          <h1 className="text-3xl font-bold text-foreground">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            Rejoignez la communauté PROMOTE-CONNECT en tant que visiteur.
          </p>
        </div>

        <Card className="surface-panel border-0">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet <span className="text-destructive">*</span></Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Entreprise / Organisation</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Nom de votre entreprise (optionnel)"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8 caractères minimum"
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
                    Création du compte...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 size-4" />
                    Créer mon compte
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground/60">
          En créant un compte, vous acceptez les conditions d&apos;utilisation de la plateforme PROMOTE-CONNECT.
        </p>
      </div>
    </div>
  );
}
