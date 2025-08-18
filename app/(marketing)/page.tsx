"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="relative" id="top">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
        <div className="pointer-events-none absolute top-40 -right-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight">
              {t('hero.title')} <span className="bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">{t('hero.title.hospitals')}</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-xl">
              {t('hero.description')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a 
                href="#demo" 
                className="group inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-white font-medium shadow-lg transition-all duration-500 ease-in-out hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95"
              >
                <span>{t('hero.demo')}</span>
                <svg 
                  className="ml-2 h-4 w-4 transition-all duration-500 ease-in-out group-hover:translate-x-1 group-hover:scale-110" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#how" className="inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/20 px-6 py-3 font-medium transition-all duration-500 ease-in-out hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/30 hover:scale-105 hover:shadow-lg active:scale-95">
                {t('hero.how')}
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-10">
        </div>
      </section>

      {/* Value props */}
      <section id="solutions" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: t('value.consultation.title'),
              desc: t('value.consultation.desc'),
              icon: "/icons/capacity.svg",
              href: "/product",
            },
            {
              title: t('value.medics.title'),
              desc: t('value.medics.desc'),
              icon: "/icons/coordination.svg",
              href: "/product/record",
            },
            {
              title: t('value.outcomes.title'),
              desc: t('value.outcomes.desc'),
              icon: "/icons/revenue.svg",
              href: "/product/misturnos",
            },
          ].map((item) => {
            const content = (
              <div className="group rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 hover:border-brand/15 dark:hover:border-brand/20 hover:bg-white/70 dark:hover:bg-white/8 active:scale-98 active:translate-y-0">
                <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4 transition-all duration-300 ease-in-out group-hover:bg-brand/15 group-hover:scale-105">
                  <Image src={item.icon} alt="" width={24} height={24} className="transition-all duration-300 ease-in-out group-hover:scale-105" />
                </div>
                <h3 className="font-semibold text-lg transition-all duration-300 ease-in-out group-hover:text-brand/80">{item.title}</h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70 transition-all duration-300 ease-in-out group-hover:text-black/80 dark:group-hover:text-white/85">{item.desc}</p>
              </div>
            );

            return item.href ? (
              <Link key={item.title} href={item.href} className="block transition-all duration-300 ease-in-out hover:scale-102 active:scale-100">
                {content}
              </Link>
            ) : (
              <div key={item.title} className="transition-all duration-300 ease-in-out hover:scale-101">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Design partner banner */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent mb-10" />
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('how.title')}</h2>
            <p className="mt-4 text-black/70 dark:text-white/70">
              {t('how.description')}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium">{t('how.pilot')}</span>
              </li>
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20" style={{transitionDelay: '0.1s'}}>
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium">{t('how.tools')}</span>
              </li>
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20" style={{transitionDelay: '0.2s'}}>
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium">{t('how.lift')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="mx-auto max-w-7xl px-6 py-20">
        <div className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 p-8 text-center bg-gradient-to-r from-brand/10 to-cyan-400/10 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-brand/10 hover:border-brand/15 dark:hover:border-brand/20 hover:from-brand/12 hover:to-cyan-400/12">
          {/* Simplified background animation */}
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-brand/15 blur-3xl transition-all duration-700 ease-out group-hover:bg-brand/20 group-hover:scale-105" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl transition-all duration-700 ease-out group-hover:bg-cyan-400/20 group-hover:scale-105" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight transition-colors duration-300 ease-out group-hover:text-brand">{t('cta.title')}</h2>
            <p className="mt-2 text-black/70 dark:text-white/70 transition-colors duration-300 ease-out group-hover:text-black dark:group-hover:text-white">{t('cta.description')}</p>
            <a
              href="mailto:lmendez@itba.edu.ar?subject=Demo%20Request%20-%20Prent%20AI"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{t('cta.demo')}</span>
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
