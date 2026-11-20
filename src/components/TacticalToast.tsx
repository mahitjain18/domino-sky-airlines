import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'critical' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp?: string;
  duration?: number; // ms, default 5000
}

interface TacticalToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const TacticalToast: React.FC<TacticalToastProps> = ({ notifications, onDismiss }) => {
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map(n => {
      const duration = n.duration || 5000;
      return setTimeout(() => {
        onDismiss(n.id);
      }, duration);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <aside
      aria-label="Tactical Operational Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none select-none font-mono text-xs"
    >
      {notifications.map(n => {
        let borderClass = 'border-[#00D9FF]/40 bg-[#0A1422]/95 text-slate-100';
        let icon = <Info className="w-4 h-4 text-[#00D9FF] shrink-0" />;

        if (n.type === 'success') {
          borderClass = 'border-[#22D3A6]/50 bg-[#061C18]/95 text-[#EAF4FF]';
          icon = <CheckCircle2 className="w-4 h-4 text-[#22D3A6] shrink-0" />;
        } else if (n.type === 'warning') {
          borderClass = 'border-[#FFB547]/50 bg-[#1F1707]/95 text-[#EAF4FF]';
          icon = <AlertTriangle className="w-4 h-4 text-[#FFB547] shrink-0" />;
        } else if (n.type === 'critical') {
          borderClass = 'border-[#FF5364]/60 bg-[#220B10]/95 text-[#EAF4FF]';
          icon = <AlertOctagon className="w-4 h-4 text-[#FF5364] shrink-0" />;
        }

        return (
          <div
            key={n.id}
            role="status"
            className={`pointer-events-auto p-3.5 rounded border shadow-2xl backdrop-blur-md flex items-start space-x-3 transition-all transform animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wider uppercase text-[11px]">{n.title}</span>
                {n.timestamp && (
                  <span className="text-[10px] text-[#8498AD] ml-2">{n.timestamp}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed break-words">
                {n.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              aria-label="Dismiss notification"
              className="text-[#8498AD] hover:text-white p-1 rounded hover:bg-white/10 transition shrink-0 focus-visible:ring-1 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
