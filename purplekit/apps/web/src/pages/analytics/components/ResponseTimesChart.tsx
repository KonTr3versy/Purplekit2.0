import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface ResponseTimesChartProps {
  data: {
    avgTTD: number | null;
    avgTTI: number | null;
    avgTTC: number | null;
    avgTTR: number | null;
  };
}

export function ResponseTimesChart({ data }: ResponseTimesChartProps) {
  const chartData = [
    { name: 'Time to Detect', value: data.avgTTD },
    { name: 'Time to Investigate', value: data.avgTTI },
    { name: 'Time to Contain', value: data.avgTTC },
    { name: 'Time to Remediate', value: data.avgTTR },
  ].filter(d => d.value !== null);

  // Show message if no data
  if (chartData.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Average Response Times
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No timing metrics available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-600" />
        Average Response Times
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            formatter={(value: any) => `${Math.round(value)}s`}
          />
          <Bar dataKey="value" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
