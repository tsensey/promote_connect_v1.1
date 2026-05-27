'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Vérifier si nous avons une session active (Supabase auto-connecte après le clic sur le lien)
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        // Rediriger vers login si le token est invalide ou expiré
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        if (type === 'recovery') {
           // On a les paramètres de hash mais pas encore de session, c'est normal, supabase va les traiter.
        } else {
           // Sinon, redirection
           setError('Lien de réinitialisation invalide ou expiré.');
        }
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      // Déconnecter l'utilisateur pour le forcer à se reconnecter avec le nouveau mot de passe
      await supabaseClient.auth.signOut();
      
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la réinitialisation du mot de passe.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-8 animate-reveal">
        <div className="flex justify-center mb-2">
          <Image
            src="/logo_transparent.png"
            alt="PROMOTE-CONNECT Logo"
            width={120}
            height={40}
            className="object-contain rounded-full shadow-md"
          />
        </div>
        <div className="space-y-2 text-center animate-reveal-delay-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Veuillez entrer votre nouveau mot de passe.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl animate-reveal-delay-1">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="space-y-6 animate-reveal-delay-2">
            <Alert className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600">
              <CheckCircle2 className="size-4" />
              <AlertDescription className="ml-2 font-medium">
                Mot de passe mis à jour avec succès. Redirection vers la page de connexion...
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-reveal-delay-2">
            <div className="space-y-3">
              <Label htmlFor="password" className="font-semibold">Nouveau mot de passe</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Minimum 6 caractères"
                  className="pl-12 pr-12 h-12 rounded-xl bg-background/50 focus-visible:ring-primary/30"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
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
              className="w-full h-12 rounded-xl text-base transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  Mettre à jour
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetSkeleton() {
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
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
