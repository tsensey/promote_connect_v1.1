import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hors ligne',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="surface-card mx-auto max-w-md p-8">
        <WifiOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Pas de connexion</h1>
        <p className="text-muted-foreground">
          Vous êtes actuellement hors ligne. Rétablissez votre connexion pour accéder à l&apos;intégralité du contenu.
        </p>
      </div>
    </div>
  );
}
