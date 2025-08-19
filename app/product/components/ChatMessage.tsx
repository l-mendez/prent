'use client';

import Link from "next/link";

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === 'assistant';

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-3xl ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isAI ? 'mr-3' : 'ml-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
            isAI 
              ? 'bg-brand shadow-lg shadow-brand/30'
              : 'bg-brand/20 text-brand hover:bg-brand/30 hover:scale-105'
          }`}>
            {isAI ? (
              <Link 
                href="/" 
                className="group transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
              >
                <img src="/prent-logo.svg" alt="Prent" className="w-5 h-5 transition-all duration-300 ease-in-out group-hover:scale-105" />
              </Link>
            ) : (
              <svg className="w-5 h-5 transition-all duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`${isAI ? 'text-left' : 'text-right'} flex-1 min-w-0`}>
          <div className={`inline-block p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl max-w-full ${
            isAI 
              ? 'bg-white/60 dark:bg-white/5 backdrop-blur border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/15 dark:hover:border-brand/20' 
              : 'bg-brand text-white shadow-brand/30 hover:brightness-110 hover:shadow-brand/40'
          }`}>
            <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}