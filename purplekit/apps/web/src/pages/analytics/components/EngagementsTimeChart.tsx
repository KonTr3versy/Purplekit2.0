import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Target } from 'lucide-react';

interface EngagementsTimeChartProps {
  data: Array<{
    date: string;
    started: number;
    completed: number;
    active: number;
  }>;
}

export function EngagementsTimeChart({ data }: EngagementsTimeChartProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-600" />
        Engagements Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            stroke="#6b7280"
          />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            labelFormatter={(value) => format(new Date(value), 'PPP')}
          />
          <Legend />
          <Line type="monotone" dataKey="started" stroke="#8b5cf6" strokeWidth={2} name="Started" />
          <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
          <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} name="Active" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
