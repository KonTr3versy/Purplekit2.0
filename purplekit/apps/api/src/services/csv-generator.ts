import Papa from 'papaparse';

export function generateExecutiveSummaryCSV(data: any): string {
  const rows = [
    ['PurpleKit Executive Summary Report'],
    [''],
    ['Engagement Information'],
    ['Name', data.engagement.name],
    ['Description', data.engagement.description || 'N/A'],
    ['Methodology', data.engagement.methodology],
    ['Status', data.engagement.status],
    [
      'Started',
      data.engagement.startedAt
        ? new Date(data.engagement.startedAt).toISOString()
        : 'N/A',
    ],
    [
      'Completed',
      data.engagement.completedAt
        ? new Date(data.engagement.completedAt).toISOString()
        : 'N/A',
    ],
    ['Created By', data.engagement.createdBy.displayName],
    [''],
    ['Key Metrics'],
    ['Total Techniques', data.stats.totalTechniques],
    ['Completion %', Math.round(data.stats.completionPercent)],
    ['Total Actions', data.stats.totalActions],
    ['Validated Actions', data.stats.validatedActions],
    ['Detection Rate %', Math.round(data.stats.detectionRate)],
    ['Total Findings', data.stats.totalFindings],
    ['Avg TTD (seconds)', data.stats.avgTTD || 'N/A'],
    ['Avg TTC (seconds)', data.stats.avgTTC || 'N/A'],
    [''],
    ['Findings by Severity'],
    ...Object.entries(data.stats.findingsBySeverity).map(
      ([severity, count]) => [severity, count]
    ),
    [''],
    ['Findings by Pillar'],
    ...Object.entries(data.stats.findingsByPillar).map(([pillar, count]) => [
      pillar,
      count,
    ]),
    [''],
    ['Critical Findings'],
    ['Title', 'Severity', 'Pillar', 'Category', 'Status', 'Created'],
    ...data.criticalFindings.map((f: any) => [
      f.title,
      f.severity,
      f.pillar,
      f.category,
      f.status,
      new Date(f.createdAt).toISOString(),
    ]),
  ];

  return Papa.unparse(rows);
}

export function generateTechnicalDetailCSV(data: any): {
  [filename: string]: string;
} {
  // Engagement overview
  const engagementCSV = Papa.unparse([
    {
      name: data.engagement.name,
      description: data.engagement.description || '',
      methodology: data.engagement.methodology,
      status: data.engagement.status,
      startedAt: data.engagement.startedAt || '',
      completedAt: data.engagement.completedAt || '',
      createdBy: data.engagement.createdBy.displayName,
      totalTechniques: data.stats.totalTechniques,
      completionPercent: Math.round(data.stats.completionPercent),
      detectionRate: Math.round(data.stats.detectionRate),
      totalFindings: data.stats.totalFindings,
    },
  ]);

  // Techniques
  const techniquesCSV = Papa.unparse(
    data.techniques.map((t: any) => ({
      techniqueId: t.techniqueId,
      name: t.name,
      tactics: t.tactics.join(', '),
      status: t.status,
      assignedTo: t.assignedTo || '',
      notes: t.notes || '',
      actionCount: t.actions.length,
    }))
  );

  // Actions
  const actionsData: any[] = [];
  data.techniques.forEach((t: any) => {
    t.actions.forEach((a: any) => {
      actionsData.push({
        technique: t.name,
        techniqueId: t.techniqueId,
        executedAt: new Date(a.executedAt).toISOString(),
        executedBy: a.executedBy,
        command: a.command || '',
        targetHost: a.targetHost || '',
        targetUser: a.targetUser || '',
        validated: a.validation ? 'Yes' : 'No',
        outcomes: a.validation ? a.validation.outcomes.join(', ') : '',
        alertPriority: a.validation?.alertPriority || '',
        ttdSeconds: a.timingMetrics?.ttdSeconds || '',
        ttcSeconds: a.timingMetrics?.ttcSeconds || '',
      });
    });
  });
  const actionsCSV = Papa.unparse(actionsData);

  // Findings
  const findingsCSV = Papa.unparse(
    data.findings.map((f: any) => ({
      title: f.title,
      description: f.description,
      severity: f.severity,
      pillar: f.pillar,
      category: f.category,
      status: f.status,
      remediationNotes: f.remediationNotes || '',
      remediationEffort: f.remediationEffort || '',
      createdBy: f.createdBy,
      createdAt: new Date(f.createdAt).toISOString(),
    }))
  );

  return {
    'engagement.csv': engagementCSV,
    'techniques.csv': techniquesCSV,
    'actions.csv': actionsCSV,
    'findings.csv': findingsCSV,
  };
}
