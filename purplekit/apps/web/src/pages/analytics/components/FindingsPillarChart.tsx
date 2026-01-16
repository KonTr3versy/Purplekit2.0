import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface FindingsPillarChartProps {
  data: Array<{
    pillar: string;
    count: number;
  }>;
}

const COLORS: Record<string, string> = {
  PEOPLE: '#8b5cf6',
  PROCESS: '#6366f1',
  TECHNOLOGY: '#06b6d4',
};

export function FindingsPillarChart({ data }: FindingsPillarChartProps) {
  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-600" />
          Findings by Pillar
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No findings data available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-purple-600" />
        Findings by Pillar
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="pillar"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label
          >
            {data.map((entry) => (
              <Cell key={entry.pillar} fill={COLORS[entry.pillar] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
