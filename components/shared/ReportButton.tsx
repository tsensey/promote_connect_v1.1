'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/client';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportButtonProps {
  reportedId: string;
  reportedName: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou publicité abusive' },
  { value: 'harassment', label: 'Harcèlement ou comportement inapproprié' },
  { value: 'scam', label: 'Arnaque ou fraude suspectée' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'other', label: 'Autre' },
];

export function ReportButton({
  reportedId,
  reportedName,
  variant = 'ghost',
  size = 'icon',
  className,
  showText = false,
}: ReportButtonProps) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Erreur', { description: 'Vous devez être connecté pour signaler un compte.' });
      return;
    }

    if (!reason) {
      toast.error('Erreur', { description: 'Veuillez sélectionner une raison.' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabaseClient.from('reports').insert({
        reporter_id: user.id,
        reported_id: reportedId,
        reason,
        details: details.trim() || null,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          // Unique violation
          toast.error('Déjà signalé', { description: `Vous avez déjà signalé ${reportedName}.` });
          setOpen(false);
          return;
        }
        throw error;
      }

      toast.success('Signalement envoyé', { description: `Merci. Notre équipe va examiner le compte de ${reportedName}.` });
      setOpen(false);
      
      // Reset form
      setReason('');
      setDetails('');
    } catch (err: any) {
      console.error('Error reporting user:', err);
      toast.error('Erreur', { description: 'Une erreur est survenue lors du signalement.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant={variant} size={size} className={className} title="Signaler ce compte">
          <Flag className="h-4 w-4" />
          {showText && <span className="ml-2">Signaler</span>}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Signaler {reportedName}</DialogTitle>
          <DialogDescription>
            Votre signalement est anonyme et nous aide à garder PROMOTE-CONNECT sûr pour tout le monde.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Raison du signalement</label>
            <Select value={reason} onValueChange={(val) => setReason(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une raison..." />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Détails supplémentaires (optionnel)
            </label>
            <Textarea
              placeholder="Fournissez plus de contexte..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || isLoading} variant="destructive">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
