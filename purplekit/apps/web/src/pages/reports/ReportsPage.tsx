import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export function ReportsPage() {
  const [selectedEngagement, setSelectedEngagement] = useState('');
  const [reportType, setReportType] = useState<
    'executive-summary' | 'technical-detail'
  >('executive-summary');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: engagementsData } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      const response = await api.get('/engagements?limit=100');
      return response.data;
    },
  });

  const engagements = engagementsData?.data || [];

  const handleGenerateReport = async () => {
    if (!selectedEngagement) {
      toast.error('Please select an engagement');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post(
        `/reports/engagement/${selectedEngagement}/${reportType}?format=${format}`,
        {},
        {
          responseType: 'blob',
        }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `report.${format}`;

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || 'Failed to generate report'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-gray-600 mt-1">
          Generate comprehensive reports for your purple team engagements
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Report
        </h2>

        <div className="space-y-4 max-w-2xl">
          {/* Engagement Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Engagement
            </label>
            <select
              value={selectedEngagement}
              onChange={(e) => setSelectedEngagement(e.target.value)}
              className="input w-full"
            >
              <option value="">Choose an engagement...</option>
              {engagements.map((eng: any) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} ({eng.status})
                </option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType('executive-summary')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === 'executive-summary'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-600 mb-2" />
                <div className="font-medium text-gray-900">
                  Executive Summary
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  High-level stats, key findings, detection rates
                </div>
              </button>

              <button
                onClick={() => setReportType('technical-detail')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === 'technical-detail'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileDown className="w-5 h-5 text-purple-600 mb-2" />
                <div className="font-medium text-gray-900">
                  Technical Detail
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Full engagement data with all techniques and actions
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">PDF (with charts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">CSV (data export)</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedEngagement}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-600">
            Perfect for leadership and stakeholders. Includes key metrics,
            detection rates, critical findings, and PPT framework analysis.
          </p>
        </div>
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-2">Technical Detail</h3>
          <p className="text-sm text-gray-600">
            Comprehensive technical report with all techniques, actions,
            validations, SIEM queries, timing metrics, and full findings
            breakdown.
          </p>
        </div>
      </div>
    </div>
  );
}
