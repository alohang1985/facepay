import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3.5 rounded-xl shadow-2xl shadow-black/40 text-[13px] font-medium flex items-center gap-3 min-w-[280px] max-w-[420px] animate-fade-in-up backdrop-blur-xl border ${
              t.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' :
              t.type === 'error' ? 'bg-danger/15 border-danger/20 text-danger' :
              t.type === 'warning' ? 'bg-amber-500/15 border-amber-500/20 text-amber-400' :
              'bg-blue-500/15 border-blue-500/20 text-blue-400'
            }`}
          >
            <span className="text-[16px] shrink-0">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer text-[14px] shrink-0"
            >×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
