/* tracing-aspecto.js */
'use strict'

// OpenTelemetry
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
const { trace } = require('@opentelemetry/api')

// exporter
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
// const { CollectorTraceExporter } = require('@opentelemetry/exporter-collector');

// instrumentations
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { ExpressInstrumentation } = require('opentelemetry-instrumentation-express')
const { MongoDBInstrumentation } = require('@opentelemetry/instrumentation-mongodb')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs')

module.exports = (serviceName) => {
  const exporter = new OTLPTraceExporter({
    url: 'https://collector.aspecto.io/v1/traces',
    headers: {
      Authorization: process.env.ASPECTO_API_KEY

    }
  })

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName
    })
  })
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter))

  provider.register()

  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations(),
      new KafkaJsInstrumentation({}),
      new HttpInstrumentation(),
      new ExpressInstrumentation({
        requestHook: (span, requestInfo) => {
          span.setAttribute('http.request.body', JSON.stringify(requestInfo.req.body))
        }
      }),
      new MongoDBInstrumentation()
    ],
    tracerProvider: provider
  })

  return trace.getTracer(serviceName)
}
