import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';

interface Engagement {
  id: string;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETE' | 'ON_HOLD';
  startDate: string;
  endDate: string | null;
  _count?: {
    techniques: number;
  };
}

interface Finding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: string;
  pillar: string;
  createdAt: string;
  engagement: {
    id: string;
    name: string;
  };
}

interface Action {
  id: string;
  executedAt: string;
  command: string | null;
  executedBy: {
    displayName: string;
  };
  engagementTechnique: {
    technique: {
      id: string;
      name: string;
    };
    engagement: {
      id: string;
      name: string;
    };
  };
  validation?: {
    id: string;
    outcome: string;
  };
}

export function DashboardPage() {
  // Fetch engagements
  const { data: engagementsData } = useQuery({
    queryKey: ['engagements', 'active'],
    queryFn: async () => {
      const response = await api.get('/engagements?limit=100');
      return response.data;
    },
  });

  // Fetch all actions for detection rate calculation
  const { data: actionsData } = useQuery({
    queryKey: ['actions', 'all'],
    queryFn: async () => {
      const response = await api.get('/actions?limit=1000');
      return response.data;
    },
  });

  // Fetch recent actions for activity feed
  const { data: recentActionsData } = useQuery({
    queryKey: ['actions', 'recent'],
    queryFn: async () => {
      const response = await api.get('/actions?limit=10&sortBy=executedAt&sortOrder=desc');
      return response.data;
    },
  });

  // Fetch findings
  const { data: findingsData } = useQuery({
    queryKey: ['findings', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/findings?limit=100');
      return response.data;
    },
  });

  const engagements: Engagement[] = engagementsData?.data || [];
  const actions: Action[] = actionsData?.data || [];
  const recentActions: Action[] = recentActionsData?.data || [];
  const findings: Finding[] = findingsData?.data || [];

  // Calculate stats
  const activeEngagements = engagements.filter(e => e.status === 'ACTIVE').length;
  const totalTechniques = engagements.reduce((sum, e) => sum + (e._count?.techniques || 0), 0);
  const validatedActions = actions.filter(a => a.validation).length;
  const detectionRate = actions.length > 0 ? Math.round((validatedActions / actions.length) * 100) : 0;
  const openFindings = findings.filter(f => f.status === 'OPEN' || f.status === 'IN_PROGRESS').length;
  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'PEOPLE':
        return 'bg-purple-100 text-purple-800';
      case 'PROCESS':
        return 'bg-indigo-100 text-indigo-800';
      case 'TECHNOLOGY':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETE':
        return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome to PurpleKit
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Engagements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeEngagements}</p>
              <p className="text-xs text-gray-500 mt-1">of {engagements.length} total</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Techniques Tested</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalTechniques}</p>
              <p className="text-xs text-gray-500 mt-1">{actions.length} actions logged</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Detection Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{detectionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {validatedActions} of {actions.length} validated
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Open Findings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{openFindings}</p>
              <p className="text-xs text-gray-500 mt-1">
                {criticalFindings.length} critical/high
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <Link
              to="/actions"
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentActions.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No recent activity. Start by logging actions in your engagements.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActions.slice(0, 5).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="mt-1">
                    {action.validation ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {action.engagementTechnique.technique.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {action.engagementTechnique.engagement.name}
                    </p>
                    {action.command && (
                      <code className="text-xs text-gray-500 block truncate mt-1 bg-gray-100 px-2 py-0.5 rounded">
                        {action.command}
                      </code>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {action.executedBy.displayName}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(action.executedAt), 'MMM d, h:mm a')}
                      </span>
                      {action.validation && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Validated
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Findings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Critical Findings</h2>
            </div>
            <Link
              to="/findings"
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {criticalFindings.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                No critical or high severity findings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalFindings.slice(0, 5).map((finding) => (
                <Link
                  key={finding.id}
                  to={`/engagements/${finding.engagement.id}`}
                  className="block p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-4"
                  style={{
                    borderLeftColor:
                      finding.severity === 'CRITICAL' ? '#dc2626' : '#ea580c',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {finding.title}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getSeverityColor(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600">
                      {finding.engagement.name}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPillarColor(
                        finding.pillar
                      )}`}
                    >
                      {finding.pillar}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(finding.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Engagements */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Active Engagements</h2>
          </div>
          <Link
            to="/engagements"
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeEngagements === 0 ? (
          <div className="py-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-4">
              No active engagements. Create one to get started.
            </p>
            <Link to="/engagements" className="btn-primary inline-flex items-center gap-2">
              <Target className="w-4 h-4" />
              Create Engagement
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engagements
              .filter(e => e.status === 'ACTIVE')
              .map((engagement) => (
                <Link
                  key={engagement.id}
                  to={`/engagements/${engagement.id}`}
                  className="card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {engagement.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEngagementStatusColor(
                        engagement.status
                      )}`}
                    >
                      {engagement.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Shield className="w-4 h-4" />
                    <span>{engagement._count?.techniques || 0} techniques</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Started {format(new Date(engagement.startDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/engagements"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-purple-100 p-3 rounded-lg">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Engagements</h3>
            <p className="text-sm text-gray-600">Manage purple team operations</p>
          </div>
        </Link>

        <Link
          to="/techniques"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-blue-100 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Techniques</h3>
            <p className="text-sm text-gray-600">Browse MITRE ATT&CK catalog</p>
          </div>
        </Link>

        <Link
          to="/findings"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-orange-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Findings</h3>
            <p className="text-sm text-gray-600">Document security gaps</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
