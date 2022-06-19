/* tracing-aspecto.js */
"use strict";

// OpenTelemetry
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");

// exporter
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
// const { CollectorTraceExporter } = require('@opentelemetry/exporter-collector');

// instrumentations
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { KafkaJsInstrumentation } = require("opentelemetry-instrumentation-kafkajs");
// const { ConnectInstrumentation } = require('@opentelemetry/instrumentation-connnect');
const { DnsInstrumentation } = require('@opentelemetry/instrumentation-dns');
const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io');

module.exports = (serviceName) => {
  const exporter = new OTLPTraceExporter({
    url: "https://collector.aspecto.io/v1/traces",
    headers: {
      Authorization: process.env.ASPECTO_API_KEY,
    },
  });

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      'what-for': "Demo for Opentelemetry by Simon Owusu"
    }),
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  provider.register();

  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations(),
      new KafkaJsInstrumentation({}),
      new HttpInstrumentation(),
      new ExpressInstrumentation({
        requestHook: (span, requestInfo) => {
          // span.setAttribute("http.request.body",JSON.stringify(requestInfo.req.body));
          span.setAttribute("request-headers",JSON.stringify(requestInfo.req.headers));
        },
      }),
      // new ConnectInstrumentation(),
      new MongoDBInstrumentation(),
      new ElasticsearchInstrumentation({
        // Config example (all optional)
        suppressInternalInstrumentation: false,
        moduleVersionAttributeName: 'elasticsearchClient.version',
        responseHook: (span, result) => {
          span.setAttribute('db.response', JSON.stringify(result));
        },
        dbStatementSerializer: (operation, params, options) => {
          return JSON.stringify(params);
  }
})
    ],
    tracerProvider: provider,
  });
  return trace.getTracer(serviceName);
};
