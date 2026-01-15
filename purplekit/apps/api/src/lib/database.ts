import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { config } from '../config';

// Global for hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.isDev 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (config.isDev) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Disconnected from PostgreSQL');
}

// Helper to set tenant context for RLS
export async function setTenantContext(orgId: string): Promise<void> {
  await prisma.$executeRawUnsafe(`SET app.current_org_id = '${orgId}'`);
}

// Helper to clear tenant context
export async function clearTenantContext(): Promise<void> {
  await prisma.$executeRawUnsafe(`SET app.current_org_id = ''`);
}
