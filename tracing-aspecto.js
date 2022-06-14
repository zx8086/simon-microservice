/* tracing-aspecto.js */
'use strict'

const opentelemetry = require('@opentelemetry/sdk-node')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')

const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')

const { registerInstrumentations } = require('@opentelemetry/instrumentation')


// import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
// import { Resource } from '@opentelemetry/resources';
// import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
// import { registerInstrumentations } from '@opentelemetry/instrumentation';

// const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')

const provider = new NodeTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'simon-microservice' // service name is required
    }),
});

provider.register();
provider.addSpanProcessor(
    new SimpleSpanProcessor(
        new OTLPTraceExporter({
            url: 'https://otelcol.aspecto.io/v1/traces',
            headers: {
                // Aspecto API-Key is required
                Authorization: process.env.ASPECTO_API_KEY
            }
        })
    )
);

registerInstrumentations({
  instrumentations: [
    // add auto instrumentations here for packages your app uses
    getNodeAutoInstrumentations ()

  ],
});
