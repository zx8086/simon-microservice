/* tracing-simon.js */
'use strict'

const opentelemetry = require('@opentelemetry/sdk-node')
const { LogLevel } = require('@opentelemetry/core')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')

const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs')
const { RouterInstrumentation } = require('@opentelemetry/instrumentation-router')
const { SocketIoInstrumentation } = require('opentelemetry-instrumentation-socket.io')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations:
    [
      getNodeAutoInstrumentations()
    ]
})

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'simon-microservice',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'Production'
  })
})

const exporter = new OTLPTraceExporter()

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
provider.register()

sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error))

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0))
})
