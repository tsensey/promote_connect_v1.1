import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guide d'utilisation | PROMOTE-CONNECT",
  description:
    "Guide utilisateur complet, intuitif et professionnel pour maîtriser PROMOTE-CONNECT.",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
