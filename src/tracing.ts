import config from './../config';

import {ConsoleSpanExporter, SimpleSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT  } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
// import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const provider = new NodeTracerProvider({
    resource: new Resource({
        [SEMRESATTRS_SERVICE_NAME]: config.telemetry.SERVICE_NAME,
        [SEMRESATTRS_SERVICE_VERSION]: config.telemetry.SERVICE_VERSION,
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.telemetry.DEPLOYMENT_ENVIRONMENT,
    }),
});

const otlpExporter = new OTLPTraceExporter({
    url: config.telemetry.OTLP_ENDPOINT,
    headers: {
        "Content-Type": "application/json",
    },
});

provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

registerInstrumentations({
    instrumentations: [
        getNodeAutoInstrumentations(),
        new HttpInstrumentation(),
        new KafkaJsInstrumentation()
    ],
    tracerProvider: provider,
});

process.on('SIGTERM', () => {
    provider.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => console.log('TracerProvider shutdown complete'));
});