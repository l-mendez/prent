import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
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
        <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60 border-b border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/prent-logo.svg" alt="Prent AI" width={28} height={28} />
              <span className="text-sm sm:text-base font-semibold tracking-tight">Prent AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#solutions" className="hover:opacity-80">Solutions</a>
              <a href="#how" className="hover:opacity-80">How it works</a>
              <a href="#contact" className="hover:opacity-80">Contact</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="#demo" className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-white text-sm font-medium shadow-sm hover:brightness-110 transition">Book a demo</a>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-black/5 dark:border-white/10 mt-24">
          <div className="mx-auto max-w-7xl px-6 py-10 grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Image src="/prent-logo.svg" alt="Prent AI" width={24} height={24} />
              <span className="font-semibold">Prent AI</span>
            </div>
            <div className="text-sm text-black/70 dark:text-white/70">
              AI orchestration for hospital operations.
            </div>
            <div className="text-sm text-right" id="contact">
              <a href="mailto:lmendez@itba.edu.ar" className="hover:opacity-80">lmendez@itba.edu.ar</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
