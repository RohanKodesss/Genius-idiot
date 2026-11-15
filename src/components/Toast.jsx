import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const tones = {
  error: { style: 'bg-bordeaux text-parchment', icon: AlertTriangle, role: 'alert' },
  success: { style: 'bg-sage text-parchment', icon: Check, role: 'status' },
  info: { style: 'bg-obsidian text-linen', icon: Info, role: 'status' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end">
      {toasts.map((toast) => {
        const tone = tones[toast.tone] ?? tones.info;
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role={tone.role}
            onClick={() => dismiss(toast.id)}
            className={`${tone.style} flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-xl px-4 py-3 shadow-card sm:min-w-[280px]`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 break-words text-sm">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-linen/10"
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
