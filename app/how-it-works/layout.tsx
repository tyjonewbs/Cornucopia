import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Cornucopia",
  description: "Learn how Cornucopia connects local buyers with producers for fresh goods and artisanal products.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
