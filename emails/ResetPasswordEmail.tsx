import {
  Hr,
  Section,
  Text,
  Button,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

export default function ResetPasswordEmail({
  fullName,
  password,
}: {
  fullName: string;
  password: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.pro';
  const loginUrl = baseUrl + '/login';

  return (
    <EmailLayout
      preview="Mot de passe réinitialisé - PROMOTE-CONNECT"
      title="Mot de passe réinitialisé"
    >
      <Text className="m-0 mb-4 text-lg font-semibold text-foreground">
        Bonjour, {fullName}
      </Text>
      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-muted">
        Votre mot de passe a été réinitialisé par un administrateur.
      </Text>

      <Section className="mb-6 rounded-xl bg-background p-6 border border-border">
        <Text className="m-0 mb-4 text-sm font-semibold uppercase tracking-widest text-muted">
          Nouveau mot de passe
        </Text>

        <Text className="m-0 leading-relaxed">
          <span className="inline-block rounded-md bg-slate-200 px-3 py-2 font-mono text-[16px] font-bold text-foreground tracking-wide">
            {password}
          </span>
        </Text>
      </Section>

      <Section className="my-8 text-center">
        <Button
          href={loginUrl}
          className="inline-block rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white no-underline shadow-md"
        >
          Se connecter à PROMOTE-CONNECT
        </Button>
      </Section>

      <Text className="m-0 text-[13px] leading-relaxed text-slate-400">
        Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe lors de votre prochaine connexion.
      </Text>

      <Hr className="my-6 border-t border-border" />

      <Text className="m-0 text-[13px] leading-relaxed text-slate-500">
        Ce mail a été envoyé automatiquement. Ne répondez pas à ce message.
      </Text>
    </EmailLayout>
  );
}

