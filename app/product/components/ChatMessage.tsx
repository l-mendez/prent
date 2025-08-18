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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAI 
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }`}>
            {isAI ? (
              <Link 
                href="/" 
                className="hover:opacity-80 hover:scale-110 transition-all duration-200 ease-in-out active:scale-95"
              >
                <img src="/prent-logo.svg" alt="Prent" className="w-5 h-5" />
              </Link>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`${isAI ? 'text-left' : 'text-right'}`}>
          <div className={`inline-block p-4 rounded-2xl ${
            isAI 
              ? 'bg-white border border-gray-200 text-gray-900' 
              : 'bg-blue-600 text-white'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}