import { format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fromDay } from '../lib/dates';

// Option B: history derived from completed_at, no snapshot table.
export default function ShiftGraph({ history }) {
  if (!history.length) {
    return <p className="text-sm text-slate">No shift history yet.</p>;
  }

  const summary = history.map((point) => point.shift).join(', ');

  return (
    <div>
      <div className="h-40 lg:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} accessibilityLayer margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#2E2E35" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(fromDay(value), 'MMM d')}
              tick={{ fill: '#8B8B94', fontSize: 11 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: '#2E2E35' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#8B8B94', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              labelFormatter={(value) => format(fromDay(value), 'MMM d, yyyy')}
              formatter={(value) => [`${value} day${value === 1 ? '' : 's'}`, 'Shift']}
              contentStyle={{
                background: '#1B1B1F',
                border: '1px solid #2E2E35',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#B3B3BB' }}
              itemStyle={{ color: '#F4F2ED' }}
            />
            <Line
              type="monotone"
              dataKey="shift"
              stroke="#C6A55C"
              strokeWidth={2}
              dot={{ r: 2, fill: '#C6A55C' }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Shift days over the last {history.length} days: {summary}.
      </p>
      <p className="mt-2 text-xs text-mist">Shift days · last {history.length} days</p>
    </div>
  );
}
