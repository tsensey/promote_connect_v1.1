import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  year?: number;
}

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: "#4A072B",
        background: "#f6f8fb",
        foreground: "#0f172a",
        muted: "#475569",
        border: "#e2e8f0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
};

export default function EmailLayout({
  preview,
  title,
  subtitle,
  children,
  year = new Date().getFullYear(),
}: EmailLayoutProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://promote-connect.pro";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[600px] bg-white rounded-3xl overflow-hidden shadow-xl border border-border">
            <Section width={'100%'} className="flex justify-between items-center bg-brand p-8 text-white w-full">
              <div>
                <Text className="m-0 text-2xl font-bold leading-tight">
                  {title}
                </Text>
                {subtitle && (
                  <Text className="m-0 mt-2 text-sm font-medium opacity-90">
                    {subtitle}
                  </Text>
                )}
              </div>
              <Img
                src={`${baseUrl}/logo_large.png`}
                width="220"
                height="44"
                alt="PROMOTE-CONNECT"
                className="mb-4 inline-block object-contain"
              />
            </Section>
            <Section className="p-8">{children}</Section>
            <Section className="bg-background px-8 py-5 text-center border-t border-border">
              <Text className="m-0 text-xs text-slate-400">
                PROMOTE-CONNECT — Plateforme de networking professionnel
              </Text>
              <Text className="m-0 mt-1 text-xs text-slate-400">
                {year} PROMOTE. Tous droits réservés.
              </Text>
              <Text className="m-0 mt-1 text-xs text-slate-400">
                Conçu par{" "}
                <Link
                  href="https://bbit-it.com"
                  className="text-slate-400 underline"
                >
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
