/* tracing-simon.js */
'use strict';

const opentelemetry = require("@opentelemetry/sdk-node");
const { LogLevel } = require("@opentelemetry/core");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs');
const { RouterInstrumentation } = require('@opentelemetry/instrumentation-router');
const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

// const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");
// const prometheusExporter = new PrometheusExporter({ startServer: true });

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  // metricExporter: prometheusExporter,
  instrumentations: 
    [
      getNodeAutoInstrumentations()
    ]
});

const provider = new NodeTracerProvider({
  resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "simon-microservice",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "Production"
    }),
});

const exporter = new OTLPTraceExporter();

// --- Metrics Working Target Common

// const metricExporter = new OTLPMetricExporter({});

// const meterProvider = new MeterProvider({
//   resource: new Resource({
//         [SemanticResourceAttributes.SERVICE_NAME]: "simon-metrics-service",
//         [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "Production",
//   }),
// });

// meterProvider.addMetricReader(new PeriodicExportingMetricReader({
//   exporter: metricExporter,
//   exportIntervalMillis: 60000,
// }));

// const meter = meterProvider.getMeter('example-exporter-collector');

// const requestCounter = meter.createCounter('requests', {
//   description: 'Example of a Counter',
// });

// const upDownCounter = meter.createUpDownCounter('test_up_down_counter', {
//   description: 'Example of a UpDownCounter',
// });

// const histogram = meter.createHistogram('test_histogram', {
//   description: 'Example of a Histogram',
// });

// const attributes = { pid: process.pid, environment: 'staging' };

// setInterval(() => {
//   requestCounter.add(1, attributes);
//   upDownCounter.add(Math.random() > 0.5 ? 1 : -1, attributes);
//   histogram.record(Math.random(), attributes);
// }, 1000);

// --

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error));

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});