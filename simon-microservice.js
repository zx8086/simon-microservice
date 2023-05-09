"use strict"

const dotenv = require("dotenv")
dotenv.config()

const PORT = process.env.PORT || 8070

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


app.use(httpLogger)
app.use(cookieParser())
app.get('/', handlers.home)
app.get('/health', handlers.health)
app.get('/trace', handlers.trace)
// app.get('/twilio', services.twilio)
// app.get('/kafka', services.kafka)
app.get('/couchbase', services.sendDataToCouchbase)
// app.get('/workplace', services.workplace)
app.use(handlers.notFound)
app.use(handlers.serverError)

const server = app.listen(parseInt(PORT, 10), () => 
  console.log(`Listening at port ${PORT}`),
  logger.info("Starting server.... Process initialized!"),
  console.log("Starting server.... Process initialized!")
  )
module.exports = server

process.on("SIGTERM", () => {
  server.close(() => {
    logger.info("Stopping server.... Process terminated!")
    console.log("Process terminated")
  })
})

// "Beware of bugs in the above code; I have only proved it correct, not tried it." - Donald Knuth
