import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

import config from './config';
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    NodeTracerProvider,
    BatchSpanProcessor
} from '@opentelemetry/sdk-trace-node';
// import {
//     MeterProvider,
//     PeriodicExportingMetricReader
// } from '@opentelemetry/sdk-metrics-base';
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metric-otlp';
import {Resource} from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import {registerInstrumentations} from "@opentelemetry/instrumentation";
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-http";

import {getNodeAutoInstrumentations} from "@opentelemetry/auto-instrumentations-node";

import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const resourceProperties = {
    [SEMRESATTRS_SERVICE_NAME]: config.telemetry.SERVICE_NAME,
    [SEMRESATTRS_SERVICE_VERSION]: config.telemetry.SERVICE_VERSION,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.telemetry.DEPLOYMENT_ENVIRONMENT,
};

const createOTLPTraceExporter = (url: string, headers: { [key: string]: string }) => new OTLPTraceExporter({url, headers});
// const createOTLPMetricExporter = (url: string, headers: { [key: string]: string }) => new OTLPMetricExporter({url, headers});

const provider = new NodeTracerProvider({resource: new Resource(resourceProperties)});

const otlpTraceExporter = createOTLPTraceExporter(config.telemetry.OTLP_TRACES_ENDPOINT, {"Content-Type": "application/json"});
// const otlpMetricExporter = createOTLPMetricExporter(config.telemetry.OTLP_METRICS_ENDPOINT, {"Content-Type": "application/json"});

provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

// Creating MetricReader with OTLPMetricExporter
// new MeterProvider({
//     resource: new Resource(resourceProperties),
//     metricReader: new PeriodicExportingMetricReader({
//         interval: 60000,
//         exporter: otlpMetricExporter,
//     }),
// });

registerInstrumentations({
    instrumentations: [
        getNodeAutoInstrumentations(),
        new HttpInstrumentation(),
        // new RuntimeNodeInstrumentation({
        //     eventLoopUtilizationMeasurementInterval: 5000,
        // }),
    ],
    tracerProvider: provider,
});
process.on('SIGTERM', () => {
    provider.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => console.log('TracerProvider shutdown complete'));
});