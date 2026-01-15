import { PrismaClient } from '@prisma/client';

export interface ExecutiveSummaryData {
  engagement: {
    id: string;
    name: string;
    description: string | null;
    methodology: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    createdBy: { displayName: string; email: string };
  };
  stats: {
    totalTechniques: number;
    techniquesByStatus: Record<string, number>;
    completionPercent: number;
    totalActions: number;
    validatedActions: number;
    detectionRate: number;
    totalFindings: number;
    findingsBySeverity: Record<string, number>;
    findingsByPillar: Record<string, number>;
    avgTTD: number | null;
    avgTTC: number | null;
  };
  criticalFindings: Array<{
    title: string;
    severity: string;
    pillar: string;
    category: string;
    status: string;
    createdAt: Date;
  }>;
  detectionsByTool: Array<{
    toolName: string;
    detectionCount: number;
  }>;
  generatedAt: Date;
}

export interface TechnicalDetailData extends ExecutiveSummaryData {
  techniques: Array<{
    techniqueId: string;
    name: string;
    tactics: string[];
    status: string;
    assignedTo: string | null;
    notes: string | null;
    actions: Array<{
      executedAt: Date;
      executedBy: string;
      command: string | null;
      targetHost: string | null;
      targetUser: string | null;
      validation: {
        outcomes: string[];
        alertPriority: string | null;
        validatedBy: string;
        validatedAt: Date;
        siemQuery: string | null;
      } | null;
      timingMetrics: {
        ttdSeconds: number | null;
        ttiSeconds: number | null;
        ttcSeconds: number | null;
        ttrSeconds: number | null;
      } | null;
    }>;
  }>;
  findings: Array<{
    title: string;
    description: string;
    severity: string;
    pillar: string;
    category: string;
    status: string;
    remediationNotes: string | null;
    remediationEffort: string | null;
    createdBy: string;
    createdAt: Date;
  }>;
}

export async function aggregateExecutiveSummary(
  prisma: PrismaClient,
  engagementId: string,
  orgId: string
): Promise<ExecutiveSummaryData> {
  // Fetch engagement with creator
  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId, orgId },
    include: {
      createdBy: { select: { displayName: true, email: true } },
    },
  });

  if (!engagement) throw new Error('Engagement not found');

  // Get all techniques with action counts
  const techniques = await prisma.engagementTechnique.findMany({
    where: { engagementId, orgId },
    include: {
      _count: { select: { actions: true } },
    },
  });

  // Count techniques by status
  const techniquesByStatus = techniques.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all actions with validations and timing
  const actions = await prisma.action.findMany({
    where: {
      engagementTechnique: { engagementId, orgId },
    },
    include: {
      detectionValidation: true,
      timingMetrics: true,
    },
  });

  const validatedActions = actions.filter((a) => a.detectionValidation).length;
  const detectionRate =
    actions.length > 0 ? (validatedActions / actions.length) * 100 : 0;

  // Calculate average TTD and TTC
  const timingMetrics = actions.map((a) => a.timingMetrics).filter(Boolean);
  const avgTTD =
    timingMetrics.length > 0
      ? timingMetrics.reduce((sum, t) => sum + (t!.ttdSeconds || 0), 0) /
        timingMetrics.length
      : null;
  const avgTTC =
    timingMetrics.length > 0
      ? timingMetrics.reduce((sum, t) => sum + (t!.ttcSeconds || 0), 0) /
        timingMetrics.length
      : null;

  // Get findings
  const findings = await prisma.finding.findMany({
    where: { engagementId, orgId },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  });

  const findingsBySeverity = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const findingsByPillar = findings.reduce((acc, f) => {
    acc[f.pillar] = (acc[f.pillar] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get critical findings (CRITICAL + HIGH)
  const criticalFindings = findings
    .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, 10)
    .map((f) => ({
      title: f.title,
      severity: f.severity,
      pillar: f.pillar,
      category: f.category,
      status: f.status,
      createdAt: f.createdAt,
    }));

  // Detection by tool
  const validations = await prisma.detectionValidation.findMany({
    where: {
      action: {
        engagementTechnique: { engagementId, orgId },
      },
    },
    include: {
      defensiveTool: { select: { name: true } },
    },
  });

  const detectionsByTool = Object.entries(
    validations.reduce((acc, v) => {
      const toolName = v.defensiveTool?.name || 'Unknown';
      acc[toolName] = (acc[toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([toolName, count]) => ({ toolName, detectionCount: count }));

  const completionPercent =
    techniques.length > 0
      ? ((techniquesByStatus['COMPLETE'] || 0) / techniques.length) * 100
      : 0;

  return {
    engagement: {
      id: engagement.id,
      name: engagement.name,
      description: engagement.description,
      methodology: engagement.methodology,
      status: engagement.status,
      startedAt: engagement.startedAt,
      completedAt: engagement.completedAt,
      createdBy: engagement.createdBy,
    },
    stats: {
      totalTechniques: techniques.length,
      techniquesByStatus,
      completionPercent,
      totalActions: actions.length,
      validatedActions,
      detectionRate,
      totalFindings: findings.length,
      findingsBySeverity,
      findingsByPillar,
      avgTTD,
      avgTTC,
    },
    criticalFindings,
    detectionsByTool,
    generatedAt: new Date(),
  };
}

export async function aggregateTechnicalDetail(
  prisma: PrismaClient,
  engagementId: string,
  orgId: string
): Promise<TechnicalDetailData> {
  const execSummary = await aggregateExecutiveSummary(
    prisma,
    engagementId,
    orgId
  );

  // Get full technique details with actions
  const techniques = await prisma.engagementTechnique.findMany({
    where: { engagementId, orgId },
    include: {
      technique: { select: { id: true, name: true, tactics: true } },
      assignedTo: { select: { displayName: true } },
      actions: {
        include: {
          executedBy: { select: { displayName: true } },
          detectionValidation: {
            include: {
              validatedBy: { select: { displayName: true } },
            },
          },
          timingMetrics: true,
        },
        orderBy: { executedAt: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  const techniquesData = techniques.map((t) => ({
    techniqueId: t.technique.id,
    name: t.technique.name,
    tactics: t.technique.tactics,
    status: t.status,
    assignedTo: t.assignedTo?.displayName || null,
    notes: t.notes,
    actions: t.actions.map((a) => ({
      executedAt: a.executedAt,
      executedBy: a.executedBy.displayName,
      command: a.command,
      targetHost: a.targetHost,
      targetUser: a.targetUser,
      validation: a.detectionValidation
        ? {
            outcomes: a.detectionValidation.outcomes,
            alertPriority: a.detectionValidation.alertPriority,
            validatedBy: a.detectionValidation.validatedBy.displayName,
            validatedAt: a.detectionValidation.validatedAt,
            siemQuery: a.detectionValidation.siemQuery,
          }
        : null,
      timingMetrics: a.timingMetrics
        ? {
            ttdSeconds: a.timingMetrics.ttdSeconds,
            ttiSeconds: a.timingMetrics.ttiSeconds,
            ttcSeconds: a.timingMetrics.ttcSeconds,
            ttrSeconds: a.timingMetrics.ttrSeconds,
          }
        : null,
    })),
  }));

  // Get all findings with full details
  const findings = await prisma.finding.findMany({
    where: { engagementId, orgId },
    include: {
      createdBy: { select: { displayName: true } },
    },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  });

  const findingsData = findings.map((f) => ({
    title: f.title,
    description: f.description,
    severity: f.severity,
    pillar: f.pillar,
    category: f.category,
    status: f.status,
    remediationNotes: f.remediationNotes,
    remediationEffort: f.remediationEffort,
    createdBy: f.createdBy.displayName,
    createdAt: f.createdAt,
  }));

  return {
    ...execSummary,
    techniques: techniquesData,
    findings: findingsData,
  };
}
