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

export default function ResetPasswordEmail({
  fullName,
  password,
}: {
  fullName: string;
  password: string;
}) {
  const loginUrl = 'https://promote-connect.com/login';
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
          mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        },
      },
    },
  };

  return (
    <Html>
      <Head />
      <Preview>Mot de passe réinitialisé - PROMOTE-CONNECT</Preview>
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
                Mot de passe réinitialisé
              </Heading>
            </Section>

            <Section className="p-8">
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
