import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield } from 'lucide-react';

interface DetectionToolsChartProps {
  data: Array<{
    toolName: string;
    detected: number;
    total: number;
    rate: number;
  }>;
}

export function DetectionToolsChart({ data }: DetectionToolsChartProps) {
  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Detection Rate by Tool
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No detection data available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Detection Rate by Tool
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="toolName" stroke="#6b7280" />
          <YAxis stroke="#6b7280" label={{ value: 'Detection Rate (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            formatter={(value: any) => `${value.toFixed(1)}%`}
          />
          <Bar dataKey="rate" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
