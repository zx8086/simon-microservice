"use strict"
// const instrument = require('@aspecto/opentelemetry');
// instrument({aspectoAuth: '1cbb856b-0558-4e75-876f-3aee212f65c7'});

const dotenv = require("dotenv")
dotenv.config()

const LogRocket = require('logrocket')
LogRocket.init('fyiyu3/simon-microservice')

const handlers = require('./lib/handlers')
const services = require('./lib/services')
const logger = require("./lib/logger")

const httpLogger = require("./httpLogger")
const cookieParser = require("cookie-parser")
// const csrf = require("csurf");
// const csrfProtection = csrf({ cookie: false });
const express = require("express")
const app = express()
app.disable("x-powered-by")

const PORT = process.env.PORT

app.use(httpLogger)
app.use(cookieParser())
app.get('/', handlers.home)
app.get('/health', handlers.health)
app.get('/trace', handlers.trace)
app.get('/twilio', services.twilio)
app.get('/kafka', services.kafka)
app.get('/couchbase', services.couchbase)
app.get('/workplace', services.workplace)
app.use(handlers.notFound)
app.use(handlers.serverError)

app.listen(parseInt(PORT, 10), () => {
  console.log(`Listening for requests on http://localhost:${PORT}`)
  logger.info("Starting server.... Process initialized!")
})

process.on("SIGTERM", () => {
  app.close(() => {
    logger.info("Stopping server.... Process terminated!")
    console.log("Process terminated")
  })
})

// "Beware of bugs in the above code; I have only proved it correct, not tried it." - Donald Knuth
