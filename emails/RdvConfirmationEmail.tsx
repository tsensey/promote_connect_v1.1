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

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: '#912450',
        background: '#f6f8fb',
        foreground: '#0f172a',
        muted: '#475569',
        border: '#e2e8f0',
        pending: '#f59e0b',
        confirmed: '#22c55e',
        cancelled: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
};

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

  const statusColorClasses: Record<string, string> = {
    pending: 'bg-pending',
    confirmed: 'bg-confirmed',
    cancelled: 'bg-cancelled',
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';

  return (
    <Html>
      <Head />
      <Preview>{statusLabels[status]}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[560px] bg-white rounded-3xl overflow-hidden shadow-xl border border-border">
            <Section className="bg-brand p-8 text-white">
              <Img
                src={`${baseUrl}/logo-promote.png`}
                width="180"
                height="auto"
                alt="PROMOTE-CONNECT"
                className="mb-4"
              />
              <Heading className="m-0 text-2xl font-bold leading-tight">
                {statusLabels[status]}
              </Heading>
            </Section>

            <Section className="p-8">
              <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColorClasses[status]}`} />
                {statusLabels[status]}
              </div>

              <div className="mb-5 rounded-xl border border-border bg-background p-5">
                <DetailRow label="De" value={demandeurName} />
                <DetailRow label="À" value={destinataireName} />
                <DetailRow label="Début" value={formatDate(startsAt)} />
                <DetailRow label="Fin" value={formatDate(endsAt)} />
              </div>

              {notes && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Text className="m-0 mb-1 text-xs font-bold uppercase text-amber-900">
                    Note :
                  </Text>
                  <Text className="m-0 text-sm leading-relaxed text-amber-800">
                    {notes}
                  </Text>
                </div>
              )}

              <Hr className="my-6 border-t border-border" />

              {status === 'pending' && (
                <Text className="m-0 text-sm leading-relaxed text-slate-500">
                  Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande.
                </Text>
              )}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <Text className="m-0 mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </Text>
      <Text className="m-0 text-[15px] font-semibold text-foreground">
        {value}
      </Text>
    </div>
  );
}
