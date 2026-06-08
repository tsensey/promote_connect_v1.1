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
import React from "react";

interface EmailLayoutProps {
  preview: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  year?: number;
}

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: "#460f40",
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
  year = 2026,
}: EmailLayoutProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://promote-connect.pro";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[600px] bg-white rounded-[12px] overflow-hidden border border-border">
            <Section width={'100%'} className="bg-brand p-6 w-full">
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tr>
                  <td align="left" valign="middle">
                    <Text className="m-0 text-xl font-bold leading-tight text-white">
                      {title}
                    </Text>
                    {subtitle && (
                      <Text className="m-0 mt-1 text-sm text-white">
                        {subtitle}
                      </Text>
                    )}
                  </td>
                  <td align="right" valign="middle">
                    <Img
                      src={`${baseUrl}/logo_large.png`}
                      width="180"
                      height="36"
                      alt="PROMOTE"
                      className="inline-block object-contain"
                    />
                  </td>
                </tr>
              </table>
            </Section>
            <Section className="px-8 pt-8 pb-6">{children}</Section>
            <Section className="bg-[#f8fafc] px-8 py-6 text-center border-t border-border">
              <Text className="m-0 text-[11px] uppercase tracking-wider text-slate-500">
                SALON INTERNATIONAL PROMOTE YAOUNDE
              </Text>
              <Text className="m-0 mt-2 text-[11px] text-slate-400">
                Cet email est généré automatiquement. Merci de ne pas y répondre.
              </Text>
              <Text className="m-0 mt-2 text-[11px] text-slate-400">
                Avec{" "}
                <Link
                  href="https://bbit-it.com"
                  className="text-slate-400 underline"
                >
                  BBIT Sarl
                </Link>{" "}
                Partenaire Technique Promote {year}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
