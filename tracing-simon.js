/* tracing-simon.js */
'use strict';

const dotenv = require('dotenv');
dotenv.config();

const opentelemetry = require("@opentelemetry/sdk-node");
const { LogLevel } = require("@opentelemetry/core");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
// const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics-base');

// const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
// const { OTLPTraceSpanExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs');
// const { RouterInstrumentation } = require('@opentelemetry/instrumentation-router');
// const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io');
// const { registerInstrumentations } = require('@opentelemetry/instrumentation');

// const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new opentelemetry.NodeSDK({
  instrumentations: 
    [
      getNodeAutoInstrumentations(),
      new ExpressInstrumentation(),
      // new RouterInstrumentation(),
      // new SocketIoInstrumentation(),
      new KafkaJsInstrumentation() 
    ]
});

const provider = new NodeTracerProvider({
  resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT
    }),
});

const exporter = new OTLPTraceExporter(   
    {
    //url: "http://192.168.0.9:4318/v1/traces",
    url: "https://otel-http.siobytes.com",
    // optional - collection of custom headers to be sent with each request, empty by default
    // headers: {},
}  
);

// --- Metrics Working Target Common
// const metricExporter = new OTLPMetricExporter({});

// const meterProvider = new MeterProvider({
//   resource: new Resource({
//       [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
//       [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT
//   }),
// });

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
