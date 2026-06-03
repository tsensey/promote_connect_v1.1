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
  Tailwind,
} from "@react-email/components";

export default function CredentialsEmail({
  fullName,
  email,
  password,
  role,
  company,
  pavillon,
  stand,
}: {
  fullName: string;
  email: string;
  password: string;
  role: string;
  company?: string | null;
  pavillon?: string | null;
  stand?: string | null;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://promote-connect.pro";
  const loginUrl = baseUrl + "/login";

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
          mono: [
            "ui-monospace",
            "SFMono-Regular",
            "Menlo",
            "Monaco",
            "Consolas",
            '"Liberation Mono"',
            '"Courier New"',
            "monospace",
          ],
        },
      },
    },
  };

  return (
    <Html>
      <Head />
      <Preview>Vos identifiants PROMOTE-CONNECT</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background m-0 px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[600px] bg-white rounded-3xl overflow-hidden shadow-xl border border-border">
            <Section className="bg-brand p-8 text-white">
              <Img
                src={`${baseUrl}/pro_connect_fr.webp`}
                width="auto"
                height="180"
                alt="PROMOTE-CONNECT"
                className="mb-4"
              />
              <Heading className="m-0 text-[26px] font-bold leading-tight">
                Votre accès est prêt
              </Heading>
            </Section>

            <Section className="p-8">
              <Text className="m-0 mb-4 text-lg font-semibold text-foreground">
                Bienvenue, {fullName}
              </Text>
              <Text className="m-0 mb-6 text-[15px] leading-relaxed text-muted">
                {`Votre compte a été créé par l'administrateur PROMOTE-CONNECT.
                Vous pouvez dès maintenant accéder à la plateforme.`}
              </Text>

              <Section className="mb-6 rounded-xl bg-background p-6 border border-border">
                <Text className="m-0 mb-4 text-sm font-semibold uppercase tracking-widest text-muted">
                  Vos identifiants
                </Text>

                <Text className="m-0 mb-4 leading-relaxed">
                  <span className="text-[13px] text-slate-400">Email</span>
                  <br />
                  <span className="text-[15px] font-semibold text-foreground">
                    {email}
                  </span>
                </Text>

                <Text className="m-0 mb-4 leading-relaxed">
                  <span className="text-[13px] text-slate-400">
                    Mot de passe
                  </span>
                  <br />
                  <span className="inline-block mt-1 rounded-md bg-slate-200 px-2 py-1 font-mono text-[15px] font-semibold text-foreground tracking-wide">
                    {password}
                  </span>
                </Text>

                <Text className="m-0 leading-relaxed">
                  <span className="text-[13px] text-slate-400">Rôle</span>
                  <br />
                  <span className="text-[15px] font-semibold text-foreground">
                    {role === "exposant"
                      ? "Exposant"
                      : role === "admin"
                        ? "Administrateur"
                        : "Visiteur"}
                  </span>
                </Text>

                {role === "exposant" && (
                  <>
                    <Text className="m-0 mt-4 leading-relaxed">
                      <span className="text-[13px] text-slate-400">
                        Entreprise
                      </span>
                      <br />
                      <span className="text-[15px] font-semibold text-foreground">
                        {company || fullName}
                      </span>
                    </Text>
                    {pavillon && (
                      <Text className="m-0 mt-4 leading-relaxed">
                        <span className="text-[13px] text-slate-400">
                          Pavillon
                        </span>
                        <br />
                        <span className="text-[15px] font-semibold text-foreground">
                          {pavillon}
                        </span>
                      </Text>
                    )}
                    {stand && (
                      <Text className="m-0 mt-4 leading-relaxed">
                        <span className="text-[13px] text-slate-400">
                          Stand
                        </span>
                        <br />
                        <span className="text-[15px] font-semibold text-foreground">
                          {stand}
                        </span>
                      </Text>
                    )}
                  </>
                )}
              </Section>

              <Section className="my-8 text-center">
                <Button
                  href={loginUrl}
                  className="inline-block rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white no-underline shadow-md"
                >
                  Se connecter à PROMOTE-CONNECT
                </Button>
              </Section>

              <Section className="mb-6 rounded-xl bg-[#f8fafc] p-6 border border-[#e2e8f0]">
                <Text className="m-0 mb-3 text-[16px] font-bold text-foreground">
                  Guide de démarrage / Quick Start Guide
                </Text>
                <Text className="m-0 mb-4 text-[14px] leading-relaxed text-muted">
                  {`Découvrez comment utiliser la plateforme PROMOTE-CONNECT pour maximiser vos opportunités d'affaires. / Discover how to use the PROMOTE-CONNECT platform to maximize your business opportunities.`}
                </Text>
                <Button
                  href={`${baseUrl}/guide`}
                  className="inline-block rounded-lg bg-slate-800 px-5 py-3 text-[14px] font-medium text-white no-underline"
                >
                  Consulter le guide / View the guide
                </Button>
              </Section>

              <Text className="m-0 text-[13px] leading-relaxed text-slate-400">
                Nous vous recommandons de changer votre mot de passe lors de
                votre première connexion.
              </Text>

              <Hr className="my-6 border-t border-border" />

              <Text className="m-0 text-[13px] leading-relaxed text-slate-500">
                Ce mail a été envoyé automatiquement. Ne répondez pas à ce
                message.
              </Text>
            </Section>

            <Section className="bg-background px-8 py-5 text-center border-t border-border">
              <Text className="m-0 text-xs text-slate-400">
                PROMOTE-CONNECT — Plateforme de networking professionnel
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
