import {
  Hr,
  Text,
  Section,
  Container,
} from '@react-email/components';
import React from 'react';
import EmailLayout from './components/EmailLayout';

interface RdvConfirmationEmailProps {
  demandeurName: string;
  destinataireName: string;
  destinataireCompany?: string;
  startsAt: string;
  endsAt: string;
  lieu?: string;
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
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDurationMinutes(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / 60000);
}

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-[#fef08a] text-black px-1.5 py-0.5 font-medium">{children}</span>
);

export default function RdvConfirmationEmail({
  demandeurName,
  destinataireName,
  destinataireCompany = 'PROMOTE',
  startsAt,
  endsAt,
  lieu = 'Salon PROMOTE',
  notes,
  status,
}: RdvConfirmationEmailProps) {
  
  const isConfirmed = status === 'confirmed';
  
  const title = (
    <>
      <span className="bg-[#fef08a] text-black px-1 mr-1">RDV</span> PROMOTE 2026
    </>
  );

  const subtitle = (
    <>
      <span className="bg-[#fef08a] text-black px-1 mr-1">Rendez-vous</span> {
        status === 'confirmed' ? 'confirmé' : status === 'cancelled' ? 'annulé' : 'en attente'
      }
    </>
  );

  return (
    <EmailLayout
      preview={`Rendez-vous ${status === 'confirmed' ? 'confirmé' : status === 'cancelled' ? 'annulé' : 'en attente'}`}
      title={title}
      subtitle={subtitle}
    >
      <Text className="m-0 mb-4 text-[15px] text-foreground">
        Bonjour <strong>{demandeurName}</strong>,
      </Text>
      
      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-slate-600">
        Un <Highlight>rendez-vous</Highlight> a été planifié entre vous et l'exposant <strong>{destinataireName}</strong> de la société <strong>{destinataireCompany}</strong>.
      </Text>

      <Section className="mb-6 w-full rounded-xl border border-border bg-white overflow-hidden">
        <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tr>
            <td className="w-[120px] border-b border-border p-4 align-top">
              <Text className="m-0 text-xs font-semibold text-brand uppercase tracking-wide">DATE</Text>
            </td>
            <td className="border-b border-border p-4 align-top">
              <Text className="m-0 text-[14px] font-medium text-foreground">
                {formatDate(startsAt)}
              </Text>
            </td>
          </tr>
          <tr>
            <td className="w-[120px] border-b border-border p-4 align-top">
              <Text className="m-0 text-xs font-semibold text-brand uppercase tracking-wide">HEURE</Text>
            </td>
            <td className="border-b border-border p-4 align-top">
              <Text className="m-0 text-[14px] font-medium text-foreground">
                {formatTime(startsAt)} <span className="text-slate-400 text-sm font-normal">({getDurationMinutes(startsAt, endsAt)} min)</span>
              </Text>
            </td>
          </tr>
          <tr>
            <td className="w-[120px] border-b border-border p-4 align-top">
              <Text className="m-0 text-xs font-semibold text-brand uppercase tracking-wide">AVEC</Text>
            </td>
            <td className="border-b border-border p-4 align-top">
              <Text className="m-0 text-[14px] font-medium text-foreground">{destinataireName}</Text>
              <Text className="m-0 mt-1 text-[13px] text-slate-500">{destinataireCompany}</Text>
            </td>
          </tr>
          <tr>
            <td className="w-[120px] border-b border-border p-4 align-top">
              <Text className="m-0 text-xs font-semibold text-brand uppercase tracking-wide">LIEU</Text>
            </td>
            <td className="border-b border-border p-4 align-top">
              <Text className="m-0 text-[14px] font-medium text-foreground">{lieu}</Text>
            </td>
          </tr>
          {notes && (
            <tr>
              <td className="w-[120px] p-4 align-top">
                <Text className="m-0 text-xs font-semibold text-brand uppercase tracking-wide">NOTES</Text>
              </td>
              <td className="p-4 align-top">
                <Text className="m-0 text-[14px] text-foreground leading-relaxed">
                  {notes}
                </Text>
              </td>
            </tr>
          )}
          {!notes && (
             <tr>
               <td colSpan={2} className="p-0 border-0 h-0"></td>
             </tr>
          )}
        </table>
      </Section>

      <Section className="rounded-[8px] bg-slate-50 p-4 text-center">
        <Text className="m-0 text-[13px] text-slate-600">
          Vous recevrez un rappel la veille et 30 minutes avant le <Highlight>rendez-vous</Highlight>.
        </Text>
      </Section>
    </EmailLayout>
  );
}
