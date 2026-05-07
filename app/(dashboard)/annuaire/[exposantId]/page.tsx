'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { createConversation } from '@/hooks/useChat';
import { ArrowLeft, Globe, MapPin, Building2, MessageSquare, Star, Package } from 'lucide-react';
import type { Database } from '@/types/database.types';

type Exposant = Database['public']['Tables']['exposants']['Row'];
type Produit = Database['public']['Tables']['produits']['Row'];

export default function ExposantDetailPage() {
  const params = useParams();
  const exposantId = params.exposantId as string;

  const [exposant, setExposant] = useState<Exposant | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: exp } = await supabaseClient
        .from('exposants')
        .select('*, profiles(full_name, company, role)')
        .eq('id', exposantId)
        .single();

      if (exp) setExposant(exp);

      const { data: prods } = await supabaseClient
        .from('produits')
        .select('*')
        .eq('exposant_id', exposantId);

      if (prods) setProduits(prods);
      setLoading(false);
    };

    loadData();
  }, [exposantId]);

  const handleContact = async () => {
    if (!exposant?.profile_id) return;
    setContacting(true);
    const { data, error } = await createConversation(exposant.profile_id);
    if (data) {
      window.location.href = `/chat/${data.id}`;
    }
    setContacting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!exposant) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Exposant non trouve</h1>
        <Link href="/annuaire" className="mt-4 inline-block text-blue-600 underline">
          Retour a l'annuaire
        </Link>
      </div>
    );
  }

  const profile = (exposant as any).profiles;

  return (
    <div className="space-y-6">
      <Link href="/annuaire" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Retour a l'annuaire
      </Link>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">{exposant.nom}</h1>
              {exposant.is_featured && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  <Star className="h-3 w-3" />
                  En vedette
                </span>
              )}
            </div>
            <p className="mt-3 text-slate-600">{exposant.description}</p>
          </div>
          <button
            onClick={handleContact}
            disabled={contacting || !exposant.profile_id}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {contacting ? '...' : 'Contacter'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {exposant.secteur && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Secteur</p>
                <p className="font-medium text-slate-900">{exposant.secteur}</p>
              </div>
            </div>
          )}
          {exposant.pays && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <MapPin className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Pays</p>
                <p className="font-medium text-slate-900">{exposant.pays}</p>
              </div>
            </div>
          )}
          {(exposant.pavillon || exposant.stand) && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <MapPin className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Localisation</p>
                <p className="font-medium text-slate-900">
                  Pavillon {exposant.pavillon}{exposant.stand && ` — Stand ${exposant.stand}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {profile?.full_name && (
          <div className="mt-4 text-sm text-slate-500">
            Contact: <span className="font-medium text-slate-700">{profile.full_name}</span>
            {profile.company && ` — ${profile.company}`}
          </div>
        )}

        {exposant.website && (
          <a
            href={exposant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 underline underline-offset-2"
          >
            <Globe className="h-4 w-4" />
            {exposant.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </section>

      {produits.length > 0 && (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits et services ({produits.length})
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((prod) => (
              <div key={prod.id} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">{prod.nom}</h3>
                {prod.description && <p className="mt-2 text-sm text-slate-600">{prod.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  {prod.categorie && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {prod.categorie}
                    </span>
                  )}
                  {prod.prix_indicatif && (
                    <span className="font-semibold text-slate-900">{prod.prix_indicatif}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
