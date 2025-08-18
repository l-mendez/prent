'use client';

import { useState, useEffect } from 'react';

export default function Sidebar() {
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
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <button className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Consultation</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Prent AI v1.0</p>
          <p className="mt-1">For medical professionals only</p>
        </div>
      </div>
    </div>
  );
}