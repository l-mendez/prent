"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out active:scale-95"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <Image src="/prent-logo.svg" alt="Prent AI" width={28} height={28} />
          <span className="text-sm sm:text-base font-semibold tracking-tight">Prent AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#solutions" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.solutions')}</a>
          <a href="#how" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.how')}</a>
          <a href="#contact" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.contact')}</a>
        </nav>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="flex items-center gap-1 px-2 py-1 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:scale-110 transition-all duration-200 ease-in-out active:scale-95"
            aria-label="Toggle language"
          >
            <span className="text-xs font-medium">
              {language === 'en' ? 'ES' : 'EN'}
            </span>
          </button>
          <a href="#demo" className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-white text-sm font-medium shadow-sm hover:brightness-110 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out active:scale-95">{t('nav.demo')}</a>
        </div>
      </div>
    </header>
  );
}
