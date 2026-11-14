import { Flame, Trophy } from 'lucide-react';
import { Card } from './ui';

export default function StreakPanel({ streak }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Card className="flex items-center gap-3">
        <Flame className="w-5 h-5 text-champagne" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-medium text-slate">Current streak</p>
          <p className="font-sans text-2xl font-semibold tabular-nums text-ink">
            {streak.current} day{streak.current === 1 ? '' : 's'}
          </p>
        </div>
      </Card>
      <Card className="flex items-center gap-3">
        <Trophy className="w-5 h-5 text-slate" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-medium text-slate">Longest</p>
          <p className="font-sans text-2xl font-semibold tabular-nums text-ink">
            {streak.longest} day{streak.longest === 1 ? '' : 's'}
          </p>
        </div>
      </Card>
    </div>
  );
}
