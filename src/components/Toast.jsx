import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const tones = {
  error: { style: 'bg-bordeaux text-obsidian', icon: AlertTriangle, role: 'alert' },
  success: { style: 'bg-sage text-obsidian', icon: Check, role: 'status' },
  info: { style: 'bg-obsidian text-ink', icon: Info, role: 'status' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const tone = tones[toast.tone] ?? tones.info;
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role={tone.role}
            onClick={() => dismiss(toast.id)}
            className={`${tone.style} rounded-xl px-4 py-3 shadow-card flex items-start gap-3 min-w-[280px] max-w-sm cursor-pointer`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(event) => {
                event.stopPropagation();
                dismiss(toast.id);
              }}
            >
              <X className="w-4 h-4 opacity-80" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
