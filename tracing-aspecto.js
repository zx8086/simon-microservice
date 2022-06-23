/* tracing-aspecto.js */
"use strict";

const dotenv = require("dotenv");
dotenv.config();

// OpenTelemetry
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");

// Exporter
// const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

// Instrumentation
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { NetInstrumentation } = require('@opentelemetry/instrumentation-net');
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { KafkaJsInstrumentation } = require("opentelemetry-instrumentation-kafkajs");
// const { ConnectInstrumentation } = require('@opentelemetry/instrumentation-connnect');
const { DnsInstrumentation } = require('@opentelemetry/instrumentation-dns');
const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io');

module.exports = (serviceName) => {
  const exporter = new OTLPTraceExporter({
    url: "https://collector.aspecto.io/v1/traces",
    serviceName: serviceName,
    headers: {
      Authorization: process.env.ASPECTO_API_KEY,
      "Content-Type": "application/json",
    },
  });

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT
    }),
    plugins: {
      kafkajs: { enabled: false, path: 'opentelemetry-plugin-kafkajs' }
    }
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  provider.register();

  registerInstrumentations({
    instrumentations: [
      // getNodeAutoInstrumentations(),
      new KafkaJsInstrumentation({}),
      // new NetInstrumentation(),
      // new HttpInstrumentation(),
      new ExpressInstrumentation({
        requestHook: (span, requestInfo) => {
          // span.setAttribute("http.request.body",JSON.stringify(requestInfo.req.body));
          span.setAttribute("request-headers",JSON.stringify(requestInfo.req.headers));
        },
      }),
      // new ConnectInstrumentation(),
      // new MongoDBInstrumentation(),
      // new DnsInstrumentation(),
      // new SocketIoInstrumentation(),
//       new ElasticsearchInstrumentation({
//         // Config example (all optional)
//         suppressInternalInstrumentation: false,
//         moduleVersionAttributeName: 'elasticsearchClient.version',
//         responseHook: (span, result) => {
//           span.setAttribute('db.response', JSON.stringify(result));
//         },
//         dbStatementSerializer: (operation, params, options) => {
//           return JSON.stringify(params);
//   }
// })
    ],
    tracerProvider: provider,
  });
  return trace.getTracer(process.env.SERVICE_NAME);
};

// "Some problems are so complex that you have to be highly intelligent and well informed just to be undecided about them." - Laurence J. Peter