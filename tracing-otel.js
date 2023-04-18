// tracing.js
'use strict'
const dotenv = require('dotenv')
dotenv.config()

const process = require('process')
const opentelemetry = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')
const { KafkaJsInstrumentation } = require('opentelemetry-instrumentation-kafkajs')
// const { BasicTracerProvider, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')
// const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node")

const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
// const consoleExporter = new ConsoleSpanExporter()

const traceExporter = new OTLPTraceExporter(   
    {
    url: "https://otel-http.siobytes.com",
}  
)

const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT
  }),
//   consoleExporter,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations(),
    new KafkaJsInstrumentation()
]
})

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0))
})
