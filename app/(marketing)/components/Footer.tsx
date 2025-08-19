"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-16 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:gap-8 md:grid md:grid-cols-3 md:gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out active:scale-95"
            >
              <Image src="/prent-logo.svg" alt="Prent AI" width={24} height={24} />
              <span className="font-semibold">Prent AI</span>
            </Link>
          </div>
          <div className="text-sm text-black/70 dark:text-white/70 text-center md:text-left">
            {t('footer.tagline')}
          </div>
          <div className="text-sm text-center md:text-right" id="contact">
            <a 
              href="mailto:lmendez@itba.edu.ar" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 hover:border-brand/20 hover:text-brand transition-all duration-200 ease-in-out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>lmendez@itba.edu.ar</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
