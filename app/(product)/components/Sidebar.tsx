'use client';

interface SidebarProps {
  onClose?: () => void;
  onNewChat?: () => void;
}

export default function Sidebar({ onClose, onNewChat }: SidebarProps = {}) {


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
          onClick={() => {
            onNewChat?.();
            onClose?.();
          }} // Start new chat and close mobile sidebar
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva consulta</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10">
        <div className="text-xs text-black/70 dark:text-white/70 text-center">
          <p className="font-medium">Prent v1.0</p>
          <p className="mt-1 text-black/50 dark:text-white/50">Sólo para profesionales médicos</p>
        </div>
      </div>
    </div>
  );
}