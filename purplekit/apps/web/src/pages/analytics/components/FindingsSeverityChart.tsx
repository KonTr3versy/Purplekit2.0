import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface FindingsSeverityChartProps {
  data: Array<{
    engagementName: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  }>;
}

export function FindingsSeverityChart({ data }: FindingsSeverityChartProps) {
  // Take top 10 engagements
  const topEngagements = data.slice(0, 10);

  // Show message if no data
  if (!topEngagements || topEngagements.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Findings by Severity (Top 10 Engagements)
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
        <AlertTriangle className="w-5 h-5 text-red-600" />
        Findings by Severity (Top 10 Engagements)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topEngagements}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="engagementName" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }} />
          <Legend />
          <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
          <Bar dataKey="high" stackId="a" fill="#f59e0b" name="High" />
          <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
          <Bar dataKey="low" stackId="a" fill="#3b82f6" name="Low" />
          <Bar dataKey="info" stackId="a" fill="#6b7280" name="Info" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
