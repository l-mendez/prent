"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
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
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#solutions" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.solutions')}</a>
          <a href="#how" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.how')}</a>
          <a href="#contact" className="hover:opacity-80 hover:scale-105 transition-all duration-200 ease-in-out">{t('nav.contact')}</a>
        </nav>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
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
          <Link href="/consultorio" className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-white text-sm font-medium shadow-sm hover:brightness-110 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out active:scale-95">{t('nav.demo')}</Link>
        </div>
        
        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
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
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 ease-in-out"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
          <nav className="px-4 py-4 space-y-3">
            <a 
              href="#solutions" 
              className="block py-2 text-sm hover:text-brand transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.solutions')}
            </a>
            <a 
              href="#how" 
              className="block py-2 text-sm hover:text-brand transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.how')}
            </a>
            <a 
              href="#contact" 
              className="block py-2 text-sm hover:text-brand transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.contact')}
            </a>
            <div className="pt-2 border-t border-black/5 dark:border-white/10">
              <Link 
                href="/consultorio" 
                className="block w-full text-center rounded-full bg-brand px-4 py-3 text-white text-sm font-medium shadow-sm hover:brightness-110 transition-all duration-200 ease-in-out"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.demo')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
