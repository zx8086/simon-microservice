export interface CouchbaseConfig {
    URL: string;
    USERNAME: string;
    PASSWORD: string;
    BUCKET: string;
    SCOPE: string;
    COLLECTION: string;
}

export interface ElysiaConfig {
    PORT: string;
    BASE_URL: string
}

export interface OpenTelemetryConfig {
    SERVICE_NAME: string;
    SERVICE_VERSION: string
    DEPLOYMENT_ENVIRONMENT: string
    OTLP_TRACES_ENDPOINT: string
    OTLP_METRICS_ENDPOINT: string
    OTLP_LOGS_ENDPOINT: string
}

export interface Config {
    couchbase: CouchbaseConfig;
    elysiaJs: ElysiaConfig;
    telemetry: OpenTelemetryConfig;
}
