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

  return (
    <Html>
      <Head />
      <Preview>Bienvenue à la newsletter PROMOTE-CONNECT</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerLabel}>PROMOTE-CONNECT</Text>
            <Heading style={headerTitle}>
              Bienvenue à la newsletter !
            </Heading>
          </Section>

          <Section style={bodySection}>
            <Text style={greeting}>Bonjour,</Text>
            <Text style={paragraphStyle}>
              Vous êtes maintenant inscrit à la newsletter PROMOTE-CONNECT.
              Vous recevrez les dernières actualités et opportunités
              d&rsquo;affaires directement dans votre boîte mail.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsTitle}>Récapitulatif de votre abonnement</Text>
              <Text style={detailItem}>
                <strong>Email :</strong> {email}
              </Text>
              <Text style={detailItem}>
                <strong>Fréquence :</strong> {frequencyLabel}
              </Text>
              {sectors && sectors.length > 0 && (
                <Text style={detailItem}>
                  <strong>Secteurs :</strong> {sectors.join(', ')}
                </Text>
              )}
            </Section>

            <Text style={paragraphStyle}>
              Vous pouvez à tout moment modifier vos préférences ou vous
              désinscrire depuis votre espace personnel.
            </Text>

            <Hr style={hr} />
            <Text style={footerText}>
              PROMOTE-CONNECT — Plateforme de networking professionnel
            </Text>
            {unsubscribeUrl && (
              <Text style={footerLink}>
                <Link href={unsubscribeUrl} style={linkStyle}>
                  Se désinscrire
                </Link>
              </Text>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerSmall}>
              {year} PROMOTE. Tous droits réservés.
            </Text>
            <Text style={footerSmall}>
              Conçu par <Link href="https://bbit-it.com" style={signatureLink}>BBIT Sarl</Link>
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
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(15,23,42,0.1)',
};

const header = {
  padding: '32px',
  backgroundColor: '#912450',
  color: '#ffffff',
};

const headerLabel = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  opacity: 0.78,
};

const headerTitle = {
  margin: '0',
  fontSize: '26px',
  lineHeight: '1.2',
  fontWeight: 700,
};

const bodySection = {
  padding: '28px',
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

const detailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 16px',
};

const detailsTitle = {
  margin: '0 0 12px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#0f172a',
};

const detailItem = {
  margin: '4px 0',
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.6',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const footerText = {
  margin: '0 0 8px',
  fontSize: '12px',
  lineHeight: '1.7',
  color: '#64748b',
};

const footerLink = {
  margin: '0',
  fontSize: '12px',
};

const linkStyle = {
  color: '#912450',
  textDecoration: 'underline',
  fontWeight: 500,
};

const footer = {
  padding: '16px 28px',
  backgroundColor: '#f8fafc',
  textAlign: 'center' as const,
};

const footerSmall = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: '#94a3b8',
};

const signatureLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};
