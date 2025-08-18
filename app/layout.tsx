
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prent.ai"),
  title: {
    default: "Prent AI — AI orchestration for hospital operations",
    template: "%s | Prent AI",
  },
  description:
    "Prent AI streamlines hospital operations with intelligent orchestration across capacity, care coordination, and revenue integrity.",
  keywords: [
    "Prent AI",
    "hospital operations",
    "healthcare AI",
    "EHR automation",
    "capacity management",
    "care coordination",
  ],
  openGraph: {
    type: "website",
    url: "https://prent.ai",
    title: "Prent AI — AI orchestration for hospital operations",
    description:
      "Streamline hospital operations with AI. Reduce delays, improve throughput, and surface revenue opportunities.",
    siteName: "Prent AI",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Prent AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prent AI — AI orchestration for hospital operations",
    description:
      "Streamline hospital operations with AI. Reduce delays, improve throughput, and surface revenue opportunities.",
    images: ["/og.png"],
  },
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
