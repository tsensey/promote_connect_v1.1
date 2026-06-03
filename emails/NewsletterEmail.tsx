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

interface NewsletterEmailProps {
  titre: string;
  contenu: string;
  recipientName?: string;
  unsubscribeUrl?: string;
  year?: number;
}

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: '#4A072B',
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

export default function NewsletterEmail({
  titre,
  contenu,
  recipientName,
  unsubscribeUrl,
  year = new Date().getFullYear(),
}: NewsletterEmailProps) {
  const paragraphs = contenu
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.pro';

  return (
    <Html>
      <Head />
      <Preview>{titre}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[680px] bg-white rounded-3xl overflow-hidden shadow-xl border border-border">
            <Section className="bg-brand p-8 text-white">
              <Img
                src={`${baseUrl}/pro_connect_fr.webp`}
                width="180"
                height="auto"
                alt="PROMOTE-CONNECT"
                className="mb-4"
              />
              <Heading className="m-0 text-3xl font-bold leading-tight">
                {titre}
              </Heading>
            </Section>

            <Section className="p-8">
              {recipientName && (
                <Text className="m-0 mb-5 text-base font-medium text-foreground">
                  Bonjour {recipientName},
                </Text>
              )}
              {paragraphs.map((paragraph, i) => (
                <Text key={i} className="m-0 mb-5 text-[15px] leading-relaxed text-muted">
                  {paragraph}
                </Text>
              ))}
              <Hr className="my-6 border-t border-border" />
              <Text className="m-0 text-[13px] leading-relaxed text-slate-500">
                Vous recevez cette newsletter car vous êtes inscrit à
                PROMOTE-CONNECT.
              </Text>
            </Section>

            <Section className="bg-background px-8 py-5 text-center border-t border-border">
              {unsubscribeUrl && (
                <Text className="m-0 mb-3 text-xs">
                  <Link
                    href={unsubscribeUrl}
                    className="font-medium text-brand underline"
                  >
                    Se désinscrire de la newsletter
                  </Link>
                </Text>
              )}
              <Text className="m-0 text-xs text-slate-400">
                PROMOTE-CONNECT — Plateforme de networking professionnel
              </Text>
              <Text className="m-0 mt-1 text-xs text-slate-400">
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
