import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Tailwind,
} from '@react-email/components';

export default function ForgotPasswordEmail({
  fullName = 'Utilisateur',
  actionLink,
}: {
  fullName?: string;
  actionLink: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';

  const tailwindConfig = {
    theme: {
      extend: {
        colors: {
          brand: '#912450',
          background: '#f6f8fb',
          foreground: '#0f172a',
          muted: '#475569',
          border: '#e2e8f0',
        },
        fontFamily: {
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        },
      },
    },
  };

  return (
    <Html>
      <Head />
      <Preview>Réinitialisation de votre mot de passe - PROMOTE-CONNECT</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[600px] bg-white rounded-3xl overflow-hidden shadow-xl border border-border">
            <Section className="bg-brand p-8 text-white">
              <Img
                src={`${baseUrl}/logo-promote.png`}
                width="180"
                height="auto"
                alt="PROMOTE-CONNECT"
                className="mb-4"
              />
              <Heading className="m-0 text-[26px] font-bold leading-tight">
                Mot de passe oublié ?
              </Heading>
            </Section>

            <Section className="p-8">
              <Text className="m-0 mb-4 text-lg font-semibold text-foreground">
                Bonjour {fullName},
              </Text>
              <Text className="m-0 mb-6 text-[15px] leading-relaxed text-muted">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte PROMOTE-CONNECT. 
                Si vous êtes à l'origine de cette demande, veuillez cliquer sur le bouton ci-dessous.
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
                Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email en toute sécurité.
              </Text>

              <Hr className="my-6 border-t border-border" />
              
              <Text className="m-0 text-[13px] leading-relaxed text-slate-500">
                Ce mail a été envoyé automatiquement. Ne répondez pas à ce message.
              </Text>
            </Section>

            <Section className="bg-background px-8 py-5 text-center border-t border-border">
              <Text className="m-0 text-xs text-slate-400">
                PROMOTE-CONNECT — Plateforme de networking professionnel
              </Text>
              <Text className="m-0 mt-1 text-xs text-slate-400">
                Conçu par{' '}
                <Link href="https://bbit-it.com" className="text-slate-400 underline">
                  BBIT Sarl
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
