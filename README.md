# Simon's Microservice for OpenTelemetry & Kafka Enablement Demo

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

**DO NOT UNDERESTIMATE THE POWER OF A PROGRAMMER.**

> "Code is expensive to change, but design is cheaper to change, and requirements are even cheaper to change." - Daniel T. Barr
> "We who cut mere stones must always be envisioning cathedrals." - Quarry worker's creed

## Quality

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=zx8086_simon-microservice&token=1e1376b0795d947a463dd39062ed2bd3b5031ea2)](https://sonarcloud.io/summary/new_code?id=zx8086_simon-microservice)

## Workflow Status

[![Dependency Review](https://github.com/zx8086/simon-microservice/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/zx8086/simon-microservice/actions/workflows/dependency-review.yml)

---
### To Add

- [X] GitHub Actions
- [X] SonarCloud
- [X] Synk
- [X] Aspecto
- [ ] GitHub Codespace
- [ ] Code Coverage

---
### Tracing Code for Node.js (Aspecto Version)

```js
'use strict'

//OpenTelemetry
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");

//exporter
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");

//instrumentations
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { KafkaJsInstrumentation } = require("opentelemetry-instrumentation-kafkajs");


module.exports = (serviceName) => {
  const exporter = new OTLPTraceExporter({
    url: "https://collector.aspecto.io/v1/traces",
    headers: {
    Authorization: process.env.ASPECTO_API_KEY

    },
  });

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  provider.register();

  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations(),
      new KafkaJsInstrumentation({}),
      new ExpressInstrumentation({
       requestHook: (span, requestInfo) => {
         span.setAttribute("http.request.body", JSON.stringify(requestInfo.req.body));
       }}),
      new MongoDBInstrumentation(),
    ],
    tracerProvider: provider,
  });

  return trace.getTracer(serviceName);
};
```

~~Sharing is NOT about Caring.~~

[Siobytes](http://code.siobytes.com)

---
[![Forking a Repo](https://res.cloudinary.com/atapas/image/upload/v1654144800/demos/Merge-Conflicts_vtk8on.png)](https://www.youtube.com/watch?v=OulZeVtZhZQ)