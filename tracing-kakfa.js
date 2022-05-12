/* tracing-kafka.js */
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

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: 
    [
      getNodeAutoInstrumentations(),
      new RouterInstrumentation(),
      // new SocketIoInstrumentation(),
      new KafkaJsInstrumentation() 
    ]
});

const provider = new NodeTracerProvider({
  resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "simon-service",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: "Production"
    }),
});

const exporter = new OTLPTraceExporter();

// Configure span processor to send spans to the exporter
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

sdk.start()
