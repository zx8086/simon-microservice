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
}

export interface Config {
    couchbase: CouchbaseConfig;
    elysiaJs: ElysiaConfig;
    telemetry: OpenTelemetryConfig;
}
