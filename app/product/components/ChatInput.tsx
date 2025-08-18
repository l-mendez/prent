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
    <div className="border-t border-gray-200 bg-white p-4">
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
                className="px-3 py-1 text-sm rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe el síntoma, pregunta sobre el tratamiento, o solicita ayuda médica..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* Disclaimer */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        ⚠️ Este modelo sólo tiene propósitos informativos. Consultar siempre con un profesional calificado.
      </div>
    </div>
  );
}