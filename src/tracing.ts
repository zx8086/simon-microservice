/*tracing.ts*/
import config from './../config';

import { NodeSDK } from '@opentelemetry/sdk-node';
import {ConsoleSpanExporter} from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs';
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// const tracerProvider = new NodeTracerProvider({
//     // be sure to disable old plugin
//     plugins: {
//         kafkajs: { enabled: false, path: 'opentelemetry-plugin-kafkajs' }
//     }
// });

const sdk = new NodeSDK({
    resource: new Resource({
        [SEMRESATTRS_SERVICE_NAME]: config.telemetry.SERVICE_NAME,
        [SEMRESATTRS_SERVICE_VERSION]: config.telemetry.SERVICE_VERSION,
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.telemetry.DEPLOYMENT_ENVIRONMENT,
    }),
    traceExporter: new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [
        getNodeAutoInstrumentations(),
        new KafkaJsInstrumentation()
    ],
});

sdk.start();

process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .then(() => console.log('Auto-instrumentation started'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0))
})