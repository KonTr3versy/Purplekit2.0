import { PrismaClient } from '@prisma/client';
import { differenceInDays, startOfDay, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from 'date-fns';

export interface AnalyticsData {
  kpis: {
    totalEngagements: number;
    engagementsByStatus: Record<string, number>;
    overallDetectionRate: number;
    avgTTD: number | null;
    criticalFindings: number;
    totalFindings: number;
  };
  charts: {
    engagementsOverTime: Array<{
      date: string;
      started: number;
      completed: number;
      active: number;
    }>;
    detectionsByTool: Array<{
      toolName: string;
      detected: number;
      total: number;
      rate: number;
    }>;
    findingsByPillar: Array<{
      pillar: string;
      count: number;
    }>;
    actionsOverTime: Array<{
      date: string;
      count: number;
    }>;
    responseTimes: {
      avgTTD: number | null;
      avgTTI: number | null;
      avgTTC: number | null;
      avgTTR: number | null;
    };
    findingsBySeverity: Array<{
      engagementName: string;
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    }>;
  };
  generatedAt: Date;
}

/**
 * Determine time bucket size based on date range
 */
function getBucketSize(startDate: Date, endDate: Date): 'day' | 'week' | 'month' {
  const days = differenceInDays(endDate, startDate);
  if (days <= 30) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

/**
 * Generate time buckets for time series charts
 */
function generateTimeBuckets(startDate: Date, endDate: Date): Date[] {
  const bucketSize = getBucketSize(startDate, endDate);

  if (bucketSize === 'day') {
    return eachDayOfInterval({ start: startDate, end: endDate });
  } else if (bucketSize === 'week') {
    return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
  } else {
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }
}

/**
 * Format date for bucket key
 */
function formatBucketDate(date: Date, bucketSize: 'day' | 'week' | 'month'): string {
  if (bucketSize === 'day') {
    return format(date, 'yyyy-MM-dd');
  } else if (bucketSize === 'week') {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  } else {
    return format(startOfMonth(date), 'yyyy-MM-dd');
  }
}

/**
 * Get date bucket for a given date
 */
function getDateBucket(date: Date, bucketSize: 'day' | 'week' | 'month'): Date {
  if (bucketSize === 'day') {
    return startOfDay(date);
  } else if (bucketSize === 'week') {
    return startOfWeek(date, { weekStartsOn: 1 });
  } else {
    return startOfMonth(date);
  }
}

/**
 * Aggregate KPIs for organization
 */
async function getKPIs(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['kpis']> {
  const whereClause: any = {
    orgId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (engagementId) {
    whereClause.id = engagementId;
  }

  // Get engagements
  const engagements = await prisma.engagement.findMany({
    where: whereClause,
    select: {
      status: true,
    },
  });

  const engagementsByStatus = engagements.reduce((acc: Record<string, number>, e: { status: string }) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get actions for detection rate
  const actionsWhere: any = {
    engagementTechnique: {
      orgId,
      engagement: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  };

  if (engagementId) {
    actionsWhere.engagementTechnique.engagementId = engagementId;
  }

  const [totalActions, validatedActions] = await Promise.all([
    prisma.action.count({
      where: actionsWhere,
    }),
    prisma.action.count({
      where: {
        ...actionsWhere,
        detectionValidation: {
          isNot: null,
        },
      },
    }),
  ]);

  const overallDetectionRate = totalActions > 0 ? (validatedActions / totalActions) * 100 : 0;

  // Get average TTD
  const timingMetrics = await prisma.timingMetrics.findMany({
    where: {
      action: actionsWhere,
      ttdSeconds: {
        not: null,
      },
    },
    select: {
      ttdSeconds: true,
    },
  });

  const avgTTD = timingMetrics.length > 0
    ? timingMetrics.reduce((sum: number, t: { ttdSeconds: number | null }) => sum + (t.ttdSeconds || 0), 0) / timingMetrics.length
    : null;

  // Get findings
  const findingsWhere: any = {
    orgId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (engagementId) {
    findingsWhere.engagementId = engagementId;
  }

  const [criticalFindings, totalFindings] = await Promise.all([
    prisma.finding.count({
      where: {
        ...findingsWhere,
        severity: {
          in: ['CRITICAL', 'HIGH'],
        },
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    }),
    prisma.finding.count({
      where: findingsWhere,
    }),
  ]);

  return {
    totalEngagements: engagements.length,
    engagementsByStatus,
    overallDetectionRate,
    avgTTD,
    criticalFindings,
    totalFindings,
  };
}

/**
 * Get engagements over time chart data
 */
async function getEngagementsOverTime(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['engagementsOverTime']> {
  const bucketSize = getBucketSize(startDate, endDate);
  const buckets = generateTimeBuckets(startDate, endDate);

  const whereClause: any = {
    orgId,
  };

  if (engagementId) {
    whereClause.id = engagementId;
  }

  // Get all engagements
  const engagements = await prisma.engagement.findMany({
    where: whereClause,
    select: {
      startedAt: true,
      completedAt: true,
      status: true,
      createdAt: true,
    },
  });

  // Initialize bucket counts
  const bucketData: Record<string, { started: number; completed: number; active: number }> = {};
  buckets.forEach(bucket => {
    const key = formatBucketDate(bucket, bucketSize);
    bucketData[key] = { started: 0, completed: 0, active: 0 };
  });

  // Count engagements by bucket
  engagements.forEach((engagement: any) => {
    if (engagement.startedAt) {
      const startBucket = getDateBucket(engagement.startedAt, bucketSize);
      const startKey = formatBucketDate(startBucket, bucketSize);
      if (bucketData[startKey]) {
        bucketData[startKey].started += 1;
      }
    }

    if (engagement.completedAt) {
      const completeBucket = getDateBucket(engagement.completedAt, bucketSize);
      const completeKey = formatBucketDate(completeBucket, bucketSize);
      if (bucketData[completeKey]) {
        bucketData[completeKey].completed += 1;
      }
    }

    // Count as active if status is ACTIVE in any bucket
    if (engagement.status === 'ACTIVE') {
      buckets.forEach(bucket => {
        const key = formatBucketDate(bucket, bucketSize);
        if (bucketData[key]) {
          bucketData[key].active += 1;
        }
      });
    }
  });

  return Object.entries(bucketData).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

/**
 * Get detection rate by tool
 */
async function getDetectionsByTool(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['detectionsByTool']> {
  const actionsWhere: any = {
    engagementTechnique: {
      orgId,
      engagement: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  };

  if (engagementId) {
    actionsWhere.engagementTechnique.engagementId = engagementId;
  }

  // Get detection validations
  const validations = await prisma.detectionValidation.findMany({
    where: {
      action: actionsWhere,
    },
    select: {
      defensiveToolId: true,
      defensiveTool: {
        select: { name: true },
      },
    },
  });

  // Get total actions for each tool
  const allActions = await prisma.action.findMany({
    where: actionsWhere,
    select: { id: true },
  });

  const totalActions = allActions.length;

  // Count detections by tool
  const toolCounts: Record<string, { detected: number; name: string }> = {};

  validations.forEach((v: any) => {
    const toolName = v.defensiveTool?.name || 'Unknown';
    if (!toolCounts[toolName]) {
      toolCounts[toolName] = { detected: 0, name: toolName };
    }
    toolCounts[toolName].detected += 1;
  });

  // Calculate rates
  return Object.values(toolCounts)
    .map(tool => ({
      toolName: tool.name,
      detected: tool.detected,
      total: totalActions,
      rate: totalActions > 0 ? (tool.detected / totalActions) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10); // Top 10 tools
}

/**
 * Get findings by pillar
 */
async function getFindingsByPillar(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['findingsByPillar']> {
  const whereClause: any = {
    orgId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (engagementId) {
    whereClause.engagementId = engagementId;
  }

  const findings = await prisma.finding.groupBy({
    by: ['pillar'],
    where: whereClause,
    _count: true,
  });

  return findings.map((f: any) => ({
    pillar: f.pillar,
    count: f._count,
  }));
}

/**
 * Get actions over time
 */
async function getActionsOverTime(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['actionsOverTime']> {
  const bucketSize = getBucketSize(startDate, endDate);
  const buckets = generateTimeBuckets(startDate, endDate);

  const actionsWhere: any = {
    engagementTechnique: {
      orgId,
      engagement: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    executedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (engagementId) {
    actionsWhere.engagementTechnique.engagementId = engagementId;
  }

  const actions = await prisma.action.findMany({
    where: actionsWhere,
    select: {
      executedAt: true,
    },
  });

  // Initialize bucket counts
  const bucketData: Record<string, number> = {};
  buckets.forEach(bucket => {
    const key = formatBucketDate(bucket, bucketSize);
    bucketData[key] = 0;
  });

  // Count actions by bucket
  actions.forEach((action: any) => {
    const bucket = getDateBucket(action.executedAt, bucketSize);
    const key = formatBucketDate(bucket, bucketSize);
    if (bucketData[key] !== undefined) {
      bucketData[key] += 1;
    }
  });

  return Object.entries(bucketData).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get average response times
 */
async function getResponseTimes(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['responseTimes']> {
  const actionsWhere: any = {
    engagementTechnique: {
      orgId,
      engagement: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  };

  if (engagementId) {
    actionsWhere.engagementTechnique.engagementId = engagementId;
  }

  const timingMetrics = await prisma.timingMetrics.aggregate({
    where: {
      action: actionsWhere,
    },
    _avg: {
      ttdSeconds: true,
      ttiSeconds: true,
      ttcSeconds: true,
      ttrSeconds: true,
    },
  });

  return {
    avgTTD: timingMetrics._avg.ttdSeconds,
    avgTTI: timingMetrics._avg.ttiSeconds,
    avgTTC: timingMetrics._avg.ttcSeconds,
    avgTTR: timingMetrics._avg.ttrSeconds,
  };
}

/**
 * Get findings by severity for top engagements
 */
async function getFindingsBySeverity(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData['charts']['findingsBySeverity']> {
  const whereClause: any = {
    orgId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (engagementId) {
    whereClause.engagementId = engagementId;
  }

  // Get all findings with engagement name
  const findings = await prisma.finding.findMany({
    where: whereClause,
    select: {
      severity: true,
      engagement: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by engagement
  const engagementFindings: Record<string, {
    name: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  }> = {};

  findings.forEach((finding: any) => {
    const engId = finding.engagement.id;
    if (!engagementFindings[engId]) {
      engagementFindings[engId] = {
        name: finding.engagement.name,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        total: 0,
      };
    }

    const severity = finding.severity.toLowerCase();
    const key = severity as 'critical' | 'high' | 'medium' | 'low' | 'info';
    engagementFindings[engId][key] += 1;
    engagementFindings[engId].total += 1;
  });

  // Sort by total findings and take top 10
  return Object.values(engagementFindings)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(({ name, critical, high, medium, low, info }) => ({
      engagementName: name,
      critical,
      high,
      medium,
      low,
      info,
    }));
}

/**
 * Main aggregation function for organization-wide analytics
 */
export async function aggregateOrganizationAnalytics(
  prisma: PrismaClient,
  orgId: string,
  startDate: Date,
  endDate: Date,
  engagementId?: string
): Promise<AnalyticsData> {
  // Run all queries in parallel
  const [
    kpis,
    engagementsOverTime,
    detectionsByTool,
    findingsByPillar,
    actionsOverTime,
    responseTimes,
    findingsBySeverity,
  ] = await Promise.all([
    getKPIs(prisma, orgId, startDate, endDate, engagementId),
    getEngagementsOverTime(prisma, orgId, startDate, endDate, engagementId),
    getDetectionsByTool(prisma, orgId, startDate, endDate, engagementId),
    getFindingsByPillar(prisma, orgId, startDate, endDate, engagementId),
    getActionsOverTime(prisma, orgId, startDate, endDate, engagementId),
    getResponseTimes(prisma, orgId, startDate, endDate, engagementId),
    getFindingsBySeverity(prisma, orgId, startDate, endDate, engagementId),
  ]);

  return {
    kpis,
    charts: {
      engagementsOverTime,
      detectionsByTool,
      findingsByPillar,
      actionsOverTime,
      responseTimes,
      findingsBySeverity,
    },
    generatedAt: new Date(),
  };
}
