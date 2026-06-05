import {
  Hr,
  Text,
  Section,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Nouvelle demande de rendez-vous', color: '#f59e0b' },
  confirmed: { label: 'Rendez-vous confirmé', color: '#22c55e' },
  cancelled: { label: 'Rendez-vous annulé', color: '#ef4444' },
};

export default function RdvConfirmationEmail({
  demandeurName,
  destinataireName,
  startsAt,
  endsAt,
  notes,
  status,
}: RdvConfirmationEmailProps) {
  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <EmailLayout
      preview={cfg.label}
      title={cfg.label}
    >
      <Section className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
        {cfg.label}
      </Section>

      <Section className="mb-5 rounded-xl border border-border bg-background p-5">
        <DetailRow label="De" value={demandeurName} />
        <DetailRow label="À" value={destinataireName} />
        <DetailRow label="Début" value={formatDate(startsAt)} />
        <DetailRow label="Fin" value={formatDate(endsAt)} />
      </Section>

      {notes && (
        <Section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Text className="m-0 mb-1 text-xs font-bold uppercase text-amber-900">
            Note :
          </Text>
          <Text className="m-0 text-sm leading-relaxed text-amber-800">
            {notes}
          </Text>
        </Section>
      )}

      <Hr className="my-6 border-t border-border" />

      {status === 'pending' && (
        <Text className="m-0 text-sm leading-relaxed text-slate-500">
          Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande.
        </Text>
      )}
    </EmailLayout>
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
