'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crown, Phone, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { type ConversionMessage } from '@/lib/subscription-helpers';

interface ConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversionModal({ open, onOpenChange }: ConversionModalProps) {
  const [content, setContent] = useState<ConversionMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && !content) {
      const loadContent = async () => {
        const { data, error } = await supabaseClient.from('platform_config').select('value').eq('key', 'conversion_message').maybeSingle();
        
        const defaults: ConversionMessage = {
          title: 'Débloquez l\'accès complet à PROMOTE-CONNECT',
          body: 'Passez à l\'abonnement PAID pour accéder à toutes les fonctionnalités : messagerie illimitée, annuaire complet, rendez-vous d\'affaires et plus encore.',
          priceDisplay: '100 000 F CFA / an',
          phone: '+229 XX XX XX XX',
          email: 'contact@promote-benin.com',
          ctaUrl: null,
          ctaLabel: 'Contacter l\'équipe PROMOTE',
        };

        if (!error && data?.value && typeof data.value === 'object') {
          const value = data.value as any;
          setContent({
            title: String(value.title ?? defaults.title),
            body: String(value.body ?? defaults.body),
            priceDisplay: String(value.price_display ?? defaults.priceDisplay),
            phone: String(value.phone ?? defaults.phone),
            email: String(value.email ?? defaults.email),
            ctaUrl: value.cta_url ? String(value.cta_url) : null,
            ctaLabel: String(value.cta_label ?? defaults.ctaLabel),
          });
        } else {
          setContent(defaults);
        }
        setLoading(false);
      };
      loadContent();
    }
  }, [open, content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {loading || !content ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-center text-xl sm:text-2xl">{content.title}</DialogTitle>
              <DialogDescription className="text-center pt-2">
                {content.body}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <span className="text-sm text-slate-500">Tarif de l'abonnement</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{content.priceDisplay}</p>
              </div>

              <div className="space-y-3 px-2">
                <p className="text-sm font-medium text-center text-slate-700">Pour souscrire, contactez-nous :</p>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{content.phone}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{content.email}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              {content.ctaUrl ? (
                <Button 
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => window.open(content.ctaUrl!, '_blank')}
                >
                  {content.ctaLabel} <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => onOpenChange(false)}
                >
                  {content.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
