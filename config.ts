// config.ts
import type { CouchbaseConfig, ElysiaConfig, OpenTelemetryConfig, Config } from './src/config/types'
function getOrThrow(envVariable: string | undefined, name: string): string {
  if (!envVariable) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return envVariable;
}

const couchbaseConfig: CouchbaseConfig = {
  URL: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_URL'], 'COUCHBASE_URL'),
  USERNAME: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_USERNAME'], 'COUCHBASE_USERNAME'),
  PASSWORD: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_PASSWORD'], 'COUCHBASE_PASSWORD'),
  BUCKET: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_BUCKET'], 'COUCHBASE_BUCKET'),
  SCOPE: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_SCOPE'], 'COUCHBASE_SCOPE'),
  COLLECTION: getOrThrow((Bun.env as Record<string, string>)['COUCHBASE_COLLECTION'], 'COUCHBASE_COLLECTION'),
};

const elysiaConfig: ElysiaConfig = {
  PORT: getOrThrow((Bun.env as Record<string, string>)['PORT'], 'PORT') || '3010',
  BASE_URL: getOrThrow((Bun.env as Record<string, string>)['BASE_URL'], 'BASE_URL') || 'http://localhost',
};

const telemetryConfig: OpenTelemetryConfig = {
  SERVICE_NAME: getOrThrow((Bun.env as Record<string, string>)['SERVICE_NAME'], 'SERVICE_NAME'),
  SERVICE_VERSION: getOrThrow((Bun.env as Record<string, string>)['SERVICE_VERSION'], 'SERVICE_VERSION'),
  DEPLOYMENT_ENVIRONMENT: getOrThrow((Bun.env as Record<string, string>)['DEPLOYMENT_ENVIRONMENT'], 'DEPLOYMENT_ENVIRONMENT'),
};

const config: Config = {
  couchbase: couchbaseConfig,
  elysiaJs: elysiaConfig,
  telemetry: telemetryConfig
};

export default config;