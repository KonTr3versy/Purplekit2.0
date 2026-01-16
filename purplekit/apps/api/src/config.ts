import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  APP_NAME: z.string().default('PurpleKit'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // S3 / MinIO
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET_EVIDENCE: z.string().default('purplekit-evidence'),
  S3_BUCKET_REPORTS: z.string().default('purplekit-reports'),
  S3_REGION: z.string().default('us-east-1'),

  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@purplekit.local'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('pretty'),

  // Feature Flags
  FEATURE_REALTIME_ENABLED: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_ATTACK_CHAINS_ENABLED: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_ANALYTICS_ENABLED: z.string().default('true').transform((v) => v === 'true'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

const env = parsedEnv.data;

export const config = {
  // App
  env: env.NODE_ENV,
  port: env.PORT,
  appName: env.APP_NAME,
  appUrl: env.APP_URL,
  apiUrl: env.API_URL,
  version: process.env.npm_package_version || '1.0.0',
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // CORS
  corsOrigins: env.NODE_ENV === 'production' 
    ? [env.APP_URL]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],

  // Database
  databaseUrl: env.DATABASE_URL,

  // Redis
  redisUrl: env.REDIS_URL,

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // S3
  s3: {
    endpoint: env.S3_ENDPOINT,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    bucketEvidence: env.S3_BUCKET_EVIDENCE,
    bucketReports: env.S3_BUCKET_REPORTS,
    region: env.S3_REGION,
  },

  // Email
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },

  // Feature Flags (defaults)
  features: {
    realtimeEnabled: env.FEATURE_REALTIME_ENABLED,
    attackChainsEnabled: env.FEATURE_ATTACK_CHAINS_ENABLED,
    analyticsEnabled: env.FEATURE_ANALYTICS_ENABLED,
  },

  // Monitoring
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
  },
} as const;

export type Config = typeof config;
