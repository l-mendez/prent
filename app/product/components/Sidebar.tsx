'use client';

import { useState, useEffect } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const [conversations, setConversations] = useState<Array<{
    id: number;
    title: string;
    timestamp: string;
    preview: string;
  }>>([]);

  useEffect(() => {
    // Set conversations after mount to avoid hydration mismatch
    setConversations([
      { id: 1, title: 'Patient Symptoms Analysis', timestamp: '2 hours ago', preview: 'Fever and headache symptoms...' },
      { id: 2, title: 'Drug Interaction Check', timestamp: 'Yesterday', preview: 'Checking compatibility of...' },
      { id: 3, title: 'Diagnosis Assistance', timestamp: '2 days ago', preview: 'Chest pain evaluation...' },
    ]);
  }, []);

  return (
    <div className="w-80 bg-white/60 dark:bg-white/5 backdrop-blur border-r border-black/10 dark:border-white/10 flex flex-col h-full flex-shrink-0 overflow-hidden">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="lg:hidden flex justify-end p-3 border-b border-black/10 dark:border-white/10">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-black/70 dark:text-white/70 hover:text-brand hover:bg-brand/10 transition-all duration-200 ease-in-out"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-3 sm:p-4">
        <button 
          className="group w-full bg-brand text-white rounded-2xl py-3 px-4 font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
          onClick={onClose} // Close mobile sidebar when new chat is started
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Consultation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 overflow-y-auto overflow-x-hidden min-h-0">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className="group p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 hover:border-brand/15 dark:hover:border-brand/20 hover:bg-white/70 dark:hover:bg-white/8 active:scale-98 cursor-pointer"
            onClick={onClose} // Close mobile sidebar when conversation is selected
          >
            <h4 className="font-medium text-sm transition-all duration-300 ease-in-out group-hover:text-brand truncate">{conversation.title}</h4>
            <p className="text-xs text-black/70 dark:text-white/70 mt-1 transition-all duration-300 ease-in-out group-hover:text-black/80 dark:group-hover:text-white/85 line-clamp-2">{conversation.preview}</p>
            <p className="text-xs text-black/50 dark:text-white/50 mt-2 transition-all duration-300 ease-in-out group-hover:text-black/60 dark:group-hover:text-white/60 truncate">{conversation.timestamp}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10">
        <div className="text-xs text-black/70 dark:text-white/70 text-center">
          <p className="font-medium">Prent AI v1.0</p>
          <p className="mt-1 text-black/50 dark:text-white/50">For medical professionals only</p>
        </div>
      </div>
    </div>
  );
}