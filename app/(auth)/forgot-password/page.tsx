'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l\'envoi de l\'email.'
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
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
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
                Un email de réinitialisation a été envoyé à {email}.
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-xl text-base"
              onClick={() => router.push('/login')}
            >
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-reveal-delay-2">
            <div className="space-y-3">
              <Label htmlFor="email" className="font-semibold">Email professionnel</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="contact@entreprise.com"
                  className="pl-12 h-12 rounded-xl bg-background/50 focus-visible:ring-primary/30"
                />
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
                  Envoi en cours...
                </>
              ) : (
                <>
                  Envoyer le lien
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
            
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 size-4" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
