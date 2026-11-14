import { Check } from 'lucide-react';

// The money interaction: instant optimistic state, no spinner (UI_SPEC §4.4).
export default function CompleteButton({ pressed, onClick, label = 'Complete' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={pressed ? 'Undo completion' : `Mark ${label} as complete`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:py-2.5 font-medium transition active:scale-[0.98] ${
        pressed
          ? 'bg-sage text-obsidian'
          : 'bg-champagne text-obsidian hover:bg-champagne-light'
      }`}
    >
      <Check className="w-4 h-4" aria-hidden="true" />
      {pressed ? 'Completed' : label}
    </button>
  );
}
