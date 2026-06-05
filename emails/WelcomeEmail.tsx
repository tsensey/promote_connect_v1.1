import {
  Hr,
  Link,
  Section,
  Text,
  Button,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

interface WelcomeEmailProps {
  email: string;
  frequency?: string;
  sectors?: string[];
  unsubscribeUrl?: string;
  year?: number;
}

export default function WelcomeEmail({
  email,
  frequency = 'weekly',
  sectors,
  unsubscribeUrl,
  year = new Date().getFullYear(),
}: WelcomeEmailProps) {
  const frequencyLabel =
    { daily: 'Quotidienne', weekly: 'Hebdomadaire', monthly: 'Mensuelle' }[
      frequency
    ] || 'Hebdomadaire';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.pro';

  return (
    <EmailLayout
      preview="Bienvenue à la newsletter PROMOTE-CONNECT"
      title="Bienvenue à la newsletter !"
      year={year}
    >
      <Text className="m-0 mb-4 text-base font-medium text-foreground">
        Bonjour,
      </Text>
      <Text className="m-0 mb-4 text-[15px] leading-relaxed text-muted">
        Vous êtes maintenant inscrit à la newsletter PROMOTE-CONNECT.
        Vous recevrez les dernières actualités et opportunités
        d&rsquo;affaires directement dans votre boîte mail.
      </Text>

      <Section className="mb-4 rounded-xl bg-background p-5 border border-border">
        <Text className="m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
          Récapitulatif de votre abonnement
        </Text>
        <Text className="m-0 mb-1 text-sm leading-relaxed text-muted">
          <strong className="text-foreground">Email :</strong> {email}
        </Text>
        <Text className="m-0 mb-1 text-sm leading-relaxed text-muted">
          <strong className="text-foreground">Fréquence :</strong> {frequencyLabel}
        </Text>
        {sectors && sectors.length > 0 && (
          <Text className="m-0 mb-1 text-sm leading-relaxed text-muted">
            <strong className="text-foreground">Secteurs :</strong> {sectors.join(', ')}
          </Text>
        )}
      </Section>

      <Section className="mb-6 rounded-xl bg-[#f8fafc] p-6 border border-[#e2e8f0]">
        <Text className="m-0 mb-3 text-[16px] font-bold text-foreground">
          Guide de démarrage / Quick Start Guide
        </Text>
        <Text className="m-0 mb-4 text-[14px] leading-relaxed text-muted">
          {`Besoin d'aide pour prendre en main la plateforme ? Consultez notre guide d'utilisation ou regardez notre courte vidéo de démonstration. / Need help getting started? Check out our user guide or watch our short demo video.`}
        </Text>
        <Button
          href={`${baseUrl}/guide`}
          className="inline-block rounded-lg bg-slate-800 px-5 py-3 text-[14px] font-medium text-white no-underline"
        >
          Consulter le guide / View the guide
        </Button>
      </Section>

      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-muted">
        Vous pouvez à tout moment modifier vos préférences ou vous
        désinscrire depuis votre espace personnel.
      </Text>

      <Hr className="my-6 border-t border-border" />

      <Text className="m-0 mb-2 text-[13px] leading-relaxed text-muted">
        PROMOTE-CONNECT — Plateforme de networking professionnel
      </Text>
      {unsubscribeUrl && (
        <Text className="m-0 text-xs">
          <Link
            href={unsubscribeUrl}
            className="font-medium text-brand underline"
          >
            Se désinscrire
          </Link>
        </Text>
      )}
    </EmailLayout>
  );
}
