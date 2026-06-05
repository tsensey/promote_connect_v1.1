import {
  Hr,
  Link,
  Text,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

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
    <EmailLayout
      preview={titre}
      title={titre}
      year={year}
    >
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
      {unsubscribeUrl && (
        <Text className="m-0 mt-4 text-xs">
          <Link
            href={unsubscribeUrl}
            className="font-medium text-brand underline"
          >
            Se désinscrire de la newsletter
          </Link>
        </Text>
      )}
    </EmailLayout>
  );
}
