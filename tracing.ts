import {HttpInstrumentation} from '@opentelemetry/instrumentation-http';
import config from './config';
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    NodeTracerProvider,
    BatchSpanProcessor
} from '@opentelemetry/sdk-trace-node';
// import {OTLPMetricExporter} from '@opentelemetry/exporter-metric-otlp';
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

const telemetryConfig = config.telemetry;

const resourceProperties = {
    [SEMRESATTRS_SERVICE_NAME]: telemetryConfig.SERVICE_NAME,
    [SEMRESATTRS_SERVICE_VERSION]: telemetryConfig.SERVICE_VERSION,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: telemetryConfig.DEPLOYMENT_ENVIRONMENT,
};

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

function createExporter(Exporter: any, url: string, headers: { [key: string]: string }) {
    return new Exporter({url, headers});
}

const createTracerProvider = (resourceProperties: any) => {
    const provider = new NodeTracerProvider({resource: new Resource(resourceProperties)});
    provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter));
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    return provider;
}

// function createMeterProvider(resourceProperties: any) {
//     return new MeterProvider({
//         resource: new Resource(resourceProperties),
//         metricReader: new PeriodicExportingMetricReader({
//             interval: 60000,
//             exporter: otlpMetricExporter,
//         }),
//     });
// }

const otlpTraceExporter = createExporter(OTLPTraceExporter, telemetryConfig.OTLP_TRACES_ENDPOINT, {"Content-Type": "application/json"});
// const otlpMetricExporter = createExporter(OTLPMetricExporter, telemetryConfig.OTLP_METRICS_ENDPOINT, {"Content-Type": "application/json"});
const provider = createTracerProvider(resourceProperties);
provider.register();

// Creating MetricReader with OTLPMetricExporter
// const meterProvider = createMeterProvider(resourceProperties);
// metrics.setGlobalMeterProvider(meterProvider);

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