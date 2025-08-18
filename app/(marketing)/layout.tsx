// app/(marketing)/layout.tsx
import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LanguageProvider } from "./contexts/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "Prent AI — AI orchestration for hospital operations",
    template: "%s | Prent AI",
  },
  description:
    "Prent AI streamlines hospital operations with intelligent orchestration across capacity, care coordination, and revenue integrity.",
  openGraph: {
    type: "website",
    url: "https://prent.ai",
    title: "Prent AI — AI orchestration for hospital operations",
    description:
      "Streamline hospital operations with AI. Reduce delays, improve throughput, and surface revenue opportunities.",
    siteName: "Prent AI",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Prent AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prent AI — AI orchestration for hospital operations",
    description:
      "Streamline hospital operations with AI. Reduce delays, improve throughput, and surface revenue opportunities.",
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
