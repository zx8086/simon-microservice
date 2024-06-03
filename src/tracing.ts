import config from './../config';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    NodeTracerProvider,
    BatchSpanProcessor
} from '@opentelemetry/sdk-trace-node';
// import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {Resource} from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import {registerInstrumentations} from "@opentelemetry/instrumentation";
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-http";

import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const resourceProperties = {
    [SEMRESATTRS_SERVICE_NAME]: config.telemetry.SERVICE_NAME,
    [SEMRESATTRS_SERVICE_VERSION]: config.telemetry.SERVICE_VERSION,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.telemetry.DEPLOYMENT_ENVIRONMENT,
};

const createOTLPExporter = (url: string, headers: { [key: string]: string }) => new OTLPTraceExporter({url, headers});

const provider = new NodeTracerProvider({resource: new Resource(resourceProperties)});

const otlpExporter = createOTLPExporter(config.telemetry.OTLP_ENDPOINT, {"Content-Type": "application/json"});

provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

registerInstrumentations({
    instrumentations: [
        // getNodeAutoInstrumentations(),
        new HttpInstrumentation(),
    ],
    tracerProvider: provider,
});

process.on('SIGTERM', () => {
    provider.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => console.log('TracerProvider shutdown complete'));
});