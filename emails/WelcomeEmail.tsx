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
  Tailwind,
} from '@react-email/components';

interface WelcomeEmailProps {
  email: string;
  frequency?: string;
  sectors?: string[];
  unsubscribeUrl?: string;
  year?: number;
}

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';

  return (
    <Html>
      <Head />
      <Preview>Bienvenue à la newsletter PROMOTE-CONNECT</Preview>
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
              <Heading className="m-0 text-2xl font-bold leading-tight">
                Bienvenue à la newsletter !
              </Heading>
            </Section>

            <Section className="p-8">
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
            </Section>

            <Section className="bg-background px-8 py-5 text-center border-t border-border">
              <Text className="m-0 text-xs text-slate-400">
                {year} PROMOTE. Tous droits réservés.
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
