import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface NewsletterEmailProps {
  titre: string;
  contenu: string;
  recipientName?: string;
  unsubscribeUrl?: string;
  year?: number;
}

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

  return (
    <Html>
      <Head />
      <Preview>{titre}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerLabel}>PROMOTE-CONNECT</Text>
            <Heading style={headerTitle}>{titre}</Heading>
          </Section>

          <Section style={bodySection}>
            {recipientName && (
              <Text style={greeting}>Bonjour {recipientName},</Text>
            )}
            {paragraphs.map((paragraph, i) => (
              <Text key={i} style={paragraphStyle}>
                {paragraph}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={footerText}>
              Vous recevez cette newsletter car vous êtes inscrit à
              PROMOTE-CONNECT.
            </Text>
          </Section>

          <Section style={footer}>
            {unsubscribeUrl && (
              <Text style={footerLink}>
                <Link href={unsubscribeUrl} style={linkStyle}>
                  Se désinscrire de la newsletter
                </Link>
              </Text>
            )}
            <Text style={footerSmall}>
              PROMOTE-CONNECT — Plateforme de networking professionnel
            </Text>
            <Text style={footerSmall}>
              {year} PROMOTE. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  margin: '0',
  padding: '32px 16px',
  backgroundColor: '#f6f8fb',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,sans-serif',
  color: '#172554',
};

const container = {
  maxWidth: '680px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(15,23,42,0.12)',
};

const header = {
  padding: '36px',
  backgroundColor: '#912450',
  color: '#ffffff',
};

const headerLabel = {
  margin: '0 0 10px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  opacity: 0.78,
};

const headerTitle = {
  margin: '0',
  fontSize: '30px',
  lineHeight: '1.2',
  fontWeight: 700,
};

const bodySection = {
  padding: '32px',
};

const greeting = {
  margin: '0 0 16px',
  fontSize: '16px',
  color: '#0f172a',
  fontWeight: 500,
};

const paragraphStyle = {
  margin: '0 0 16px',
  lineHeight: '1.7',
  color: '#475569',
  fontSize: '15px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const footerText = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '1.7',
  color: '#64748b',
};

const footer = {
  padding: '20px 32px',
  backgroundColor: '#f8fafc',
  textAlign: 'center' as const,
};

const footerLink = {
  margin: '0 0 8px',
  fontSize: '12px',
};

const linkStyle = {
  color: '#912450',
  textDecoration: 'underline',
  fontWeight: 500,
};

const footerSmall = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: '#94a3b8',
};
