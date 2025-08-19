// app/(marketing)/layout.tsx
import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LanguageProvider } from "./contexts/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "Prent AI — Orquestación de IA para operaciones hospitalarias",
    template: "%s | Prent AI",
  },
  description:
    "Prent AI optimiza las operaciones hospitalarias con orquestación inteligente en capacidad, coordinación de la atención e integridad de ingresos.",
  openGraph: {
    type: "website",
    url: "https://prent.ai",
    title: "Prent AI — Orquestación de IA para operaciones hospitalarias",
    description:
      "Optimiza las operaciones hospitalarias con IA. Reduce demoras, mejora el flujo y detecta oportunidades de ingresos.",
    siteName: "Prent AI",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Prent AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prent AI — Orquestación de IA para operaciones hospitalarias",
    description:
      "Optimiza las operaciones hospitalarias con IA. Reduce demoras, mejora el flujo y detecta oportunidades de ingresos.",
    images: ["/og.png"],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </LanguageProvider>
  );
}
