import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import {
  Target,
  Shield,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';
import { EngagementsTimeChart } from './components/EngagementsTimeChart';
import { DetectionToolsChart } from './components/DetectionToolsChart';
import { FindingsPillarChart } from './components/FindingsPillarChart';
import { ResponseTimesChart } from './components/ResponseTimesChart';
import { ActionsTimeChart } from './components/ActionsTimeChart';
import { FindingsSeverityChart } from './components/FindingsSeverityChart';
import { Link } from 'react-router-dom';

interface KPICardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  subtitle: string;
  color: 'purple' | 'blue' | 'green' | 'red';
}

function KPICard({ icon: Icon, label, value, subtitle, color }: KPICardProps) {
  const colorClasses = {
    purple: { border: 'border-l-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' },
    blue: { border: 'border-l-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { border: 'border-l-green-500', bg: 'bg-green-100', text: 'text-green-600' },
    red: { border: 'border-l-red-500', bg: 'bg-red-100', text: 'text-red-600' },
  };

  return (
    <div className={`card p-6 hover:shadow-lg transition-shadow border-l-4 ${colorClasses[color].border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
        </div>
      </div>
    </div>
  );
}

interface DateRangeFilterProps {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 365 days', days: 365 },
  ];

  // Find current selection
  const currentDays = Math.round((value.endDate.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentPreset = presets.find(p => p.days === currentDays)?.days || 90;

  return (
    <div className="flex items-center gap-2">
      <select
        className="input"
        value={currentPreset}
        onChange={(e) => {
          const days = parseInt(e.target.value);
          onChange({
            startDate: subDays(new Date(), days),
            endDate: new Date(),
          });
        }}
      >
        {presets.map(p => (
          <option key={p.days} value={p.days}>{p.label}</option>
        ))}
      </select>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Failed to Load Analytics
      </h3>
      <p className="text-gray-600 mb-6">
        {error.message || 'An error occurred while loading analytics data.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Try Again
      </button>
    </div>
  );
}

function EmptyAnalyticsState() {
  return (
    <div className="text-center py-12">
      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Analytics Data Yet
      </h3>
      <p className="text-gray-600 mb-6">
        Start creating engagements and logging actions to see analytics.
      </p>
      <Link to="/engagements" className="btn-primary inline-flex items-center gap-2">
        <Target className="w-4 h-4" />
        Create First Engagement
      </Link>
    </div>
  );
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
}

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 90),
    endDate: new Date(),
  });

  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
      const response = await api.get(`/analytics?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle states
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error as Error} />;
  if (!data || data.kpis.totalEngagements === 0) return <EmptyAnalyticsState />;

  return (
    <div className="space-y-6">
      {/* Header with date filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Organization-wide metrics and insights
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Target}
          label="Total Engagements"
          value={data.kpis.totalEngagements}
          subtitle={`${data.kpis.engagementsByStatus.ACTIVE || 0} active`}
          color="purple"
        />
        <KPICard
          icon={Shield}
          label="Detection Rate"
          value={`${data.kpis.overallDetectionRate.toFixed(1)}%`}
          subtitle="Actions detected"
          color="blue"
        />
        <KPICard
          icon={Clock}
          label="Avg Time to Detect"
          value={data.kpis.avgTTD ? formatSeconds(data.kpis.avgTTD) : 'N/A'}
          subtitle="Response time"
          color="green"
        />
        <KPICard
          icon={AlertTriangle}
          label="Critical Findings"
          value={data.kpis.criticalFindings}
          subtitle={`${data.kpis.totalFindings} total`}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementsTimeChart data={data.charts.engagementsOverTime} />
        <DetectionToolsChart data={data.charts.detectionsByTool} />
        <FindingsPillarChart data={data.charts.findingsByPillar} />
        <ResponseTimesChart data={data.charts.responseTimes} />
      </div>

      {/* Full-width charts */}
      <ActionsTimeChart data={data.charts.actionsOverTime} />
      <FindingsSeverityChart data={data.charts.findingsBySeverity} />
    </div>
  );
}
