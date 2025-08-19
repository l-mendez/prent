'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
}

export default function ChatInput({ onSendMessage, isLoading = false, suggestions = [] }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = suggestions;

  const handleQuickSend = (text: string) => {
    if (isLoading) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessage('');
  };

  return (
    <div className="flex-shrink-0 border-t border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
      {/* Quick Prompts */}
      {quickPrompts.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickSend(prompt)}
                disabled={isLoading}
                className="group px-3 py-1 text-sm rounded-full transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed bg-brand/10 text-brand hover:bg-brand/20 hover:scale-105 hover:shadow-md active:scale-95 border border-brand/20 hover:border-brand/30"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 min-w-0">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe el síntoma, pregunta sobre el tratamiento, o solicita ayuda médica..."
            className="w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out focus:shadow-lg focus:scale-[1.02] hover:bg-white/70 dark:hover:bg-white/8"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="group flex-shrink-0 p-3 bg-brand text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 disabled:bg-black/20 dark:disabled:bg-white/20 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none active:scale-95 self-end"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* Disclaimer */}
      <div className="mt-3 text-xs text-black/70 dark:text-white/70 text-center">
        ⚠️ Este modelo sólo tiene propósitos informativos. Consultar siempre con un profesional calificado.
      </div>
    </div>
  );
}