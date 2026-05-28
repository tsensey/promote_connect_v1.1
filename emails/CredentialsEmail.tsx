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
} from '@react-email/components';

export default function CredentialsEmail({
  fullName,
  email,
  password,
  role,
}: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) {
  const loginUrl = 'https://promote-connect.com/login';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';

  return (
    <Html>
      <Head />
      <Preview>Vos identifiants PROMOTE-CONNECT</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${baseUrl}/logo-promote.png`} width="180" height="auto" alt="PROMOTE-CONNECT" style={logo} />
            <Heading style={headerTitle}>
              Votre accès est prêt
            </Heading>
          </Section>

          <Section style={bodySection}>
            <Text style={greeting}>Bienvenue, {fullName}</Text>
            <Text style={paragraphStyle}>
              Votre compte a été créé par l'administrateur PROMOTE-CONNECT.
              Vous pouvez dès maintenant accéder à la plateforme.
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialsTitle}>Vos identifiants</Text>
              
              <Text style={detailItem}>
                <span style={detailLabel}>Email</span>
                <br />
                <span style={detailValue}>{email}</span>
              </Text>
              
              <Text style={detailItem}>
                <span style={detailLabel}>Mot de passe</span>
                <br />
                <span style={passwordValue}>{password}</span>
              </Text>

              <Text style={detailItem}>
                <span style={detailLabel}>Rôle</span>
                <br />
                <span style={detailValue}>{role === 'exposant' ? 'Exposant' : 'Visiteur'}</span>
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={loginUrl} style={button}>
                Se connecter à PROMOTE-CONNECT
              </Button>
            </Section>

            <Text style={infoText}>
              Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
            </Text>

            <Hr style={hr} />
            <Text style={footerText}>
              Ce mail a été envoyé automatiquement. Ne répondez pas à ce message.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerSmall}>
              PROMOTE-CONNECT — Plateforme de networking professionnel
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

const logo = {
  margin: '0 0 16px',
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
  fontSize: '18px',
  color: '#0f172a',
  fontWeight: 600,
};

const paragraphStyle = {
  margin: '0 0 24px',
  lineHeight: '1.7',
  color: '#475569',
  fontSize: '15px',
};

const credentialsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px',
  border: '1px solid #e2e8f0',
};

const credentialsTitle = {
  margin: '0 0 16px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const detailItem = {
  margin: '0 0 12px',
  lineHeight: '1.6',
};

const detailLabel = {
  fontSize: '13px',
  color: '#94a3b8',
};

const detailValue = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
};

const passwordValue = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
  fontFamily: 'monospace',
  backgroundColor: '#e2e8f0',
  padding: '4px 8px',
  borderRadius: '6px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#912450',
  color: '#ffffff',
  padding: '14px 24px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
};

const infoText = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#94a3b8',
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

const footerSmall = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: '#94a3b8',
};

const signatureLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};
