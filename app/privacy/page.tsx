import { MarketingNavbar } from '@/components/landing/MarketingNavbar';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

export const metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données de PROMOTE-CONNECT',
};

export default function PolitiqueConfidentialite() {
  return (
    <>
      <MarketingNavbar />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Politique de Confidentialité</h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Collecte des données</h2>
            <p className="mb-4">Nous collectons les données personnelles que vous nous fournissez lors de la création de votre compte, telles que votre nom, adresse e-mail, entreprise, secteur d'activité et fonction.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Utilisation des données</h2>
            <p className="mb-4">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Créer et gérer votre compte utilisateur.</li>
              <li>Faciliter la mise en relation avec d'autres participants au salon.</li>
              <li>Vous envoyer des notifications importantes concernant l'événement.</li>
              <li>Améliorer nos services et votre expérience sur la plateforme.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Partage des données</h2>
            <p className="mb-4">Nous ne vendons pas vos données personnelles. Elles peuvent être partagées avec d'autres utilisateurs de la plateforme (selon vos paramètres de visibilité) et avec nos prestataires de services techniques dans le cadre strict de l'exécution de nos services.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Sécurité des données</h2>
            <p className="mb-4">Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Vos droits (RGPD)</h2>
            <p className="mb-4">Conformément à la réglementation en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Droit d'accès et de rectification de vos données.</li>
              <li>Droit à l'effacement (droit à l'oubli).</li>
              <li>Droit à la limitation du traitement.</li>
              <li>Droit à la portabilité de vos données.</li>
            </ul>
            <p className="mb-4">Pour exercer ces droits, vous pouvez nous contacter à dpo@promote-connect.com ou utiliser les paramètres de votre compte.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Cookies</h2>
            <p className="mb-4">Nous utilisons des cookies essentiels pour le fonctionnement de la plateforme (authentification, sécurité) et des cookies d'analyse (Plausible) respectueux de la vie privée, ne nécessitant pas de consentement explicite car ils ne tracent pas les individus à travers différents sites web.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Modification de la politique</h2>
            <p className="mb-4">Cette politique peut être mise à jour occasionnellement. Nous vous informerons de tout changement significatif par e-mail ou via une notification sur la plateforme.</p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
