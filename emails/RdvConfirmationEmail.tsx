import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface RdvConfirmationEmailProps {
  demandeurName: string;
  destinataireName: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RdvConfirmationEmail({
  demandeurName,
  destinataireName,
  startsAt,
  endsAt,
  notes,
  status,
}: RdvConfirmationEmailProps) {
  const statusLabels: Record<string, string> = {
    pending: 'Nouvelle demande de rendez-vous',
    confirmed: 'Rendez-vous confirmé',
    cancelled: 'Rendez-vous annulé',
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#22c55e',
    cancelled: '#ef4444',
  };

  return (
    <Html>
      <Head />
      <Preview>{statusLabels[status]}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerLabel}>PROMOTE-CONNECT</Text>
            <Heading style={headerTitle}>{statusLabels[status]}</Heading>
          </Section>

          <Section style={bodySection}>
            <div style={statusBadge}>
              <span style={{ ...statusDot, backgroundColor: statusColors[status] }} />
              {statusLabels[status]}
            </div>

            <div style={detailBox}>
              <DetailRow label="De" value={demandeurName} />
              <DetailRow label="À" value={destinataireName} />
              <DetailRow label="Début" value={formatDate(startsAt)} />
              <DetailRow label="Fin" value={formatDate(endsAt)} />
            </div>

            {notes && (
              <div style={notesBox}>
                <Text style={notesLabel}>Note :</Text>
                <Text style={notesContent}>{notes}</Text>
              </div>
            )}

            <Hr style={hr} />

            {status === 'pending' && (
              <Text style={infoText}>
                Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande.
              </Text>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerSmall}>
              PROMOTE-CONNECT — Plateforme de networking professionnel
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailRow}>
      <Text style={detailLabel}>{label}</Text>
      <Text style={detailValue}>{value}</Text>
    </div>
  );
}

const main = {
  margin: '0',
  padding: '32px 16px',
  backgroundColor: '#f6f8fb',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(15,23,42,0.12)',
};

const header = {
  padding: '32px',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
};

const headerLabel = {
  margin: '0 0 8px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  opacity: 0.78,
};

const headerTitle = {
  margin: '0',
  fontSize: '24px',
};

const bodySection = {
  padding: '32px',
};

const statusBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '24px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#475569',
};

const statusDot = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
};

const detailBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  margin: '0 0 2px',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#94a3b8',
  fontWeight: 600,
};

const detailValue = {
  margin: '0',
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
};

const notesBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '24px',
};

const notesLabel = {
  margin: '0 0 4px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  color: '#92400e',
};

const notesContent = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#78350f',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const infoText = {
  margin: '0',
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.6',
};

const footer = {
  padding: '20px 32px',
  backgroundColor: '#f8fafc',
  textAlign: 'center' as const,
};

const footerSmall = {
  margin: '0',
  fontSize: '12px',
  color: '#94a3b8',
};
