import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PlayCircle, FileText, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Guide d'utilisation | PROMOTE-CONNECT",
  description: "Découvrez comment utiliser la plateforme PROMOTE-CONNECT.",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-brand text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/login" 
            className="inline-flex items-center text-brand-100 hover:text-white mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil / Back to home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Guide de démarrage rapide
          </h1>
          <p className="text-lg text-brand-100 max-w-2xl">
            Tout ce dont vous avez besoin pour bien démarrer sur PROMOTE-CONNECT et maximiser vos opportunités d'affaires.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 mb-16">
          {/* Section Vidéo */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Tutoriel Vidéo (FR)</h2>
            <p className="text-slate-600 mb-6 line-clamp-2">
              Regardez notre courte vidéo de présentation pour découvrir les fonctionnalités clés en moins de 3 minutes.
            </p>
            <div className="aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
              <PlayCircle className="w-12 h-12 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-slate-500">Vidéo à venir</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Video Tutorial (EN)</h2>
            <p className="text-slate-600 mb-6 line-clamp-2">
              Watch our short video overview to discover the key features in less than 3 minutes.
            </p>
            <div className="aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
              <PlayCircle className="w-12 h-12 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-slate-500">Video coming soon</span>
            </div>
          </div>
        </div>

        {/* Documentation textuelle */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Les fonctionnalités principales</h2>
            <p className="text-slate-600">Découvrez comment utiliser chaque module de la plateforme.</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {features.map((feature, index) => (
              <div key={index} className="p-6 sm:p-8 hover:bg-slate-50 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
                  <ChevronRight className="w-5 h-5 text-brand mr-2" />
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed ml-7">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const features = [
  {
    title: "1. L'Annuaire des exposants",
    description: "Recherchez et filtrez facilement les exposants par secteur d'activité, pays ou pavillon. C'est le point de départ idéal pour identifier vos futurs partenaires commerciaux.",
  },
  {
    title: "2. La Messagerie privée",
    description: "Entrez en contact direct avec les autres participants. Le chat en temps réel vous permet d'échanger de manière fluide et de conserver l'historique de vos discussions pendant toute la durée de votre abonnement.",
  },
  {
    title: "3. L'Agenda interactif et Rendez-vous B2B",
    description: "Consultez le programme officiel de PROMOTE et organisez vos rendez-vous B2B. Envoyez des demandes de rendez-vous aux exposants et gérez votre planning directement depuis l'application.",
  },
  {
    title: "4. La Vitrine produits (Exposants)",
    description: "Si vous êtes exposant, vous pouvez mettre en avant vos produits et services directement sur votre profil pour attirer l'attention des visiteurs.",
  }
];
