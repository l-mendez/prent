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
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}