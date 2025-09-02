'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/(product)/components/Header';
import Sidebar from '@/app/(product)/components/Sidebar';
import ChatInterface from '@/app/(product)/components/ChatInterface';
import LoadingScreen from '@/app/(product)/components/LoadingScreen';
import { ChatConfigProvider } from '@/app/(product)/components/ChatConfigContext';

export default function Consultorio() {
  const [mounted, setMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatInstanceId, setChatInstanceId] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleNewChat = () => {
    setChatInstanceId((prev) => prev + 1);
  };

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-10 sm:-top-20 -left-10 sm:-left-20 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute top-20 sm:top-40 -right-8 sm:-right-16 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
      
      <Header 
        onToggleSidebar={toggleMobileSidebar}
        isSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        <ChatConfigProvider mode="consultorio">
          <div className="hidden lg:block">
            <Sidebar onNewChat={handleNewChat} />
          </div>
          
          {isMobileSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div 
                className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white/90 dark:bg-black/90 backdrop-blur-md border-r border-black/10 dark:border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
              </div>
            </div>
          )}
          
          <main className="flex-1 flex flex-col bg-white/60 dark:bg-white/5 backdrop-blur lg:border-l border-black/10 dark:border-white/10 min-w-0 overflow-hidden">
            <ChatInterface key={chatInstanceId} mode="consultorio" />
          </main>
        </ChatConfigProvider>
      </div>
    </div>
  );
}


