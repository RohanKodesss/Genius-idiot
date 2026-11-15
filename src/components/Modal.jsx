import { useRef } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from './useFocusTrap';

export default function Modal({ title, onClose, children, footer }) {
  const dialogRef = useRef(null);
  const titleId = 'modal-title';

  useFocusTrap(true, dialogRef, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-obsidian/40 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-0.5rem)] w-full flex-col rounded-t-2xl bg-parchment p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card outline-none sm:mx-4 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <h2 id={titleId} className="min-w-0 break-words font-display text-xl text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate hover:bg-ivory hover:text-ink sm:-mr-2 sm:-mt-1 sm:h-9 sm:w-9"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
        {footer && (
          <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
