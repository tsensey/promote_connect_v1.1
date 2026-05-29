import { MarketingNavbar } from '@/components/landing/MarketingNavbar';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

export const metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de PROMOTE-CONNECT",
};

export default function ConditionsUtilisation() {
  return (
    <>
      <MarketingNavbar />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Conditions d'Utilisation</h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptation des conditions</h2>
            <p className="mb-4">En accédant et en utilisant PROMOTE-CONNECT, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Description du service</h2>
            <p className="mb-4">PROMOTE-CONNECT est une plateforme de networking digital pour les salons professionnels PROMOTE. Elle permet aux exposants et visiteurs de se connecter, d'échanger et de générer des affaires pendant 12 mois.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Compte utilisateur</h2>
            <p className="mb-4">Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Comportement de l'utilisateur</h2>
            <p className="mb-4">Vous acceptez de ne pas utiliser la plateforme pour :</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Transmettre des contenus illégaux, offensants ou diffamatoires.</li>
              <li>Usurper l'identité d'une autre personne ou entité.</li>
              <li>Perturber ou interrompre les services de la plateforme.</li>
              <li>Collecter des données d'autres utilisateurs sans leur consentement.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Propriété intellectuelle</h2>
            <p className="mb-4">Tous les contenus présents sur PROMOTE-CONNECT (textes, images, logos, etc.) sont protégés par le droit d'auteur. Vous ne pouvez pas les utiliser sans notre autorisation préalable écrite.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Limitation de responsabilité</h2>
            <p className="mb-4">PROMOTE-CONNECT n'est pas responsable des dommages directs ou indirects résultant de l'utilisation de la plateforme ou de l'impossibilité d'y accéder.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Modification des conditions</h2>
            <p className="mb-4">Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur la plateforme.</p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Contact</h2>
            <p className="mb-4">Pour toute question concernant ces conditions, veuillez nous contacter à l'adresse support@promote-connect.com.</p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
