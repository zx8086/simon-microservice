/* tracing-app.js */
'use strict';

const opentelemetry = require("@opentelemetry/sdk-node");
const { LogLevel } = require("@opentelemetry/core");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics-base');

const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs');
const { RouterInstrumentation } = require('@opentelemetry/instrumentation-router');
const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io');
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

// const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// // For troubleshooting, set the log level to DiagLogLevel.DEBUG
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new opentelemetry.NodeSDK({
  // traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: 
    [
      getNodeAutoInstrumentations(),
      // new RouterInstrumentation(),
      // new SocketIoInstrumentation(),
      new KafkaJsInstrumentation() 
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
const metricExporter = new OTLPMetricExporter({});

const meterProvider = new MeterProvider({
  resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "simon-metrics-service",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "Production",
  }),
});

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

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