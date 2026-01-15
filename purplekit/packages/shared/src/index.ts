// =============================================================================
// PurpleKit Shared Types
// =============================================================================
// These types are shared between frontend and backend
// =============================================================================

// Re-export Zod for validation
export { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const UserRole = {
  ADMIN: 'ADMIN',
  RED_LEAD: 'RED_LEAD',
  BLUE_LEAD: 'BLUE_LEAD',
  ANALYST: 'ANALYST',
  OBSERVER: 'OBSERVER',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const EngagementStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type EngagementStatus = typeof EngagementStatus[keyof typeof EngagementStatus];

export const Methodology = {
  ATOMIC: 'ATOMIC',
  SCENARIO: 'SCENARIO',
} as const;
export type Methodology = typeof Methodology[keyof typeof Methodology];

export const VisibilityMode = {
  OPEN: 'OPEN',
  BLIND_BLUE: 'BLIND_BLUE',
  BLIND_RED: 'BLIND_RED',
} as const;
export type VisibilityMode = typeof VisibilityMode[keyof typeof VisibilityMode];

export const TechniqueStatus = {
  PLANNED: 'PLANNED',
  BLOCKED: 'BLOCKED',
  EXECUTING: 'EXECUTING',
  VALIDATING: 'VALIDATING',
  COMPLETE: 'COMPLETE',
} as const;
export type TechniqueStatus = typeof TechniqueStatus[keyof typeof TechniqueStatus];

export const DetectionOutcome = {
  LOGGED: 'LOGGED',
  ALERTED: 'ALERTED',
  PREVENTED: 'PREVENTED',
  NOT_LOGGED: 'NOT_LOGGED',
} as const;
export type DetectionOutcome = typeof DetectionOutcome[keyof typeof DetectionOutcome];

export const AlertPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;
export type AlertPriority = typeof AlertPriority[keyof typeof AlertPriority];

export const FindingPillar = {
  PEOPLE: 'PEOPLE',
  PROCESS: 'PROCESS',
  TECHNOLOGY: 'TECHNOLOGY',
} as const;
export type FindingPillar = typeof FindingPillar[keyof typeof FindingPillar];

export const FindingCategory = {
  // Technology
  TELEMETRY_GAP: 'TELEMETRY_GAP',
  DETECTION_GAP: 'DETECTION_GAP',
  PREVENTION_GAP: 'PREVENTION_GAP',
  TOOL_MISCONFIGURATION: 'TOOL_MISCONFIGURATION',
  INTEGRATION_ISSUE: 'INTEGRATION_ISSUE',
  // Process
  MISSING_PLAYBOOK: 'MISSING_PLAYBOOK',
  PLAYBOOK_NOT_FOLLOWED: 'PLAYBOOK_NOT_FOLLOWED',
  ESCALATION_FAILURE: 'ESCALATION_FAILURE',
  COMMUNICATION_GAP: 'COMMUNICATION_GAP',
  DOCUMENTATION_GAP: 'DOCUMENTATION_GAP',
  // People
  SKILLS_GAP: 'SKILLS_GAP',
  CAPACITY_ISSUE: 'CAPACITY_ISSUE',
  AWARENESS_GAP: 'AWARENESS_GAP',
} as const;
export type FindingCategory = typeof FindingCategory[keyof typeof FindingCategory];

export const FindingSeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;
export type FindingSeverity = typeof FindingSeverity[keyof typeof FindingSeverity];

export const FindingStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  WONT_FIX: 'WONT_FIX',
  DEFERRED: 'DEFERRED',
} as const;
export type FindingStatus = typeof FindingStatus[keyof typeof FindingStatus];

export const ReportType = {
  TACTICAL: 'TACTICAL',
  OPERATIONAL: 'OPERATIONAL',
  STRATEGIC: 'STRATEGIC',
  NAVIGATOR: 'NAVIGATOR',
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

export const ReportStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// =============================================================================
// Common Types
// =============================================================================

export interface PaginationMeta {
  total: number;
  limit: number;
  cursor: string | null;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

// =============================================================================
// API Response Types
// =============================================================================

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserSummary;
}
