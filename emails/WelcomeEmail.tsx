export default function WelcomeEmail({ fullName }: { fullName: string }) {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>
      <h1>Bienvenue sur PROMOTE-CONNECT</h1>
      <p>Bonjour {fullName},</p>
      <p>Merci d’avoir rejoint la plateforme de networking PROMOTE. Votre espace est prêt pour découvrir les exposants, échanger, planifier vos rendez-vous et recevoir la newsletter exclusive.</p>
      <p>À bientôt sur la plateforme !</p>
    </div>
  );
}
