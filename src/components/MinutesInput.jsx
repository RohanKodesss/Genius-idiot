import { useId, useState } from 'react';

// Optional time log. Completion is what counts; minutes are a nicety.
export default function MinutesInput({ value, onSave }) {
  const [minutes, setMinutes] = useState(value ?? '');
  const inputId = useId();

  return (
    <form
      className="flex items-center gap-2 mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (minutes === '') return;
        onSave(Number(minutes));
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Minutes spent
      </label>
      <input
        id={inputId}
        type="number"
        min="0"
        inputMode="numeric"
        value={minutes}
        onChange={(event) => setMinutes(event.target.value)}
        placeholder="min"
        className="w-20 bg-ivory border border-sand rounded-lg px-2 py-1 text-xs tabular-nums text-ink placeholder:text-mist focus:border-champagne"
      />
      <button type="submit" className="text-xs text-slate hover:text-ink underline underline-offset-4">
        Log
      </button>
    </form>
  );
}
