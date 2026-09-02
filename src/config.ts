import { z } from 'zod';

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().url().optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().max(100).default(10),
  CORS_ORIGINS: z.string().default('')
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = EnvironmentSchema.safeParse(source);
  if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.message}`);
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }
  return parsed.data;
}
