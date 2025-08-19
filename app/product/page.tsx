'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/product/components/Header';
import Sidebar from '@/app/product/components/Sidebar';
import ChatInterface from '@/app/product/components/ChatInterface';
import LoadingScreen from '@/app/product/components/LoadingScreen';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Background effects similar to marketing page */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute top-40 -right-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
      
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col bg-white/60 dark:bg-white/5 backdrop-blur border-l border-black/10 dark:border-white/10 min-w-0 overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}