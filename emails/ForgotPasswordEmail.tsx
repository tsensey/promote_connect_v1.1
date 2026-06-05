import {
  Hr,
  Link,
  Section,
  Text,
  Button,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

export default function ForgotPasswordEmail({
  fullName = 'Utilisateur',
  actionLink,
}: {
  fullName?: string;
  actionLink: string;
}) {
  return (
    <EmailLayout
      preview="Réinitialisation de votre mot de passe - PROMOTE-CONNECT"
      title="Mot de passe oublié ?"
    >
      <Text className="m-0 mb-4 text-lg font-semibold text-foreground">
        Bonjour {fullName},
      </Text>
      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-muted">
        {`Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte PROMOTE-CONNECT.
                Si vous êtes à l'origine de cette demande, veuillez cliquer sur le bouton ci-dessous.`}
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={actionLink}
          className="inline-block rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white no-underline shadow-md"
        >
          Réinitialiser mon mot de passe
        </Button>
      </Section>

      <Text className="m-0 text-[13px] leading-relaxed text-slate-400">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
        <br />
        <Link href={actionLink} className="text-brand break-all underline mt-2 inline-block">
          {actionLink}
        </Link>
      </Text>

      <Text className="m-0 mt-6 text-[13px] leading-relaxed text-slate-400">
        {`Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email en toute sécurité.`}
      </Text>

      <Hr className="my-6 border-t border-border" />

      <Text className="m-0 text-[13px] leading-relaxed text-slate-500">
        Ce mail a été envoyé automatiquement. Ne répondez pas à ce message.
      </Text>
    </EmailLayout>
  );
}

