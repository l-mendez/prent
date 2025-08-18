"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-6 md:grid-cols-3">
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out active:scale-95"
        >
          <Image src="/prent-logo.svg" alt="Prent AI" width={24} height={24} />
          <span className="font-semibold">Prent AI</span>
        </Link>
        <div className="text-sm text-black/70 dark:text-white/70">
          {t('footer.tagline')}
        </div>
        <div className="text-sm text-right" id="contact">
          <a href="mailto:lmendez@itba.edu.ar" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">lmendez@itba.edu.ar</a>
        </div>
      </div>
    </footer>
  );
}
