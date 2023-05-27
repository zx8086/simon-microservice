"use strict"

const dotenv = require("dotenv")
dotenv.config()

const InfisicalClient = require("infisical-node")
const envVariable = new InfisicalClient({
    token: process.env.INFISICAL_TOKEN
})

const handlers = require('./handlers')
const services = require('./services')
const logger = require("./logger")

const httpLogger = require("./httpLogger")

function logAndWriteToLogger(message) {
    console.log(message)  
    logger.info(message) 
  }

const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const Joi = require('joi')

const PORT = process.env.PORT || 8070

const server = Hapi.server({        
    port: PORT,
    host: 'localhost'
})

server.route({
    method: 'GET',
    path: '/',
    handler: handlers.home
})

server.route({
    method: 'GET',
    path: '/health',
    handler: handlers.health
})

server.route({
    method: 'GET',
    path: '/createScopes/{scope}',
    handler: handlers.createScopes
})

server.route({
    method: 'GET',
    path: '/createCollections/{scope}/{collection}',
    handler: handlers.createCollections
})

server.route({
    method: 'GET',
    path: '/createIndexes/{scopeName}/{collectionName}',
    handler: handlers.createIndexes
  })
  
server.route({
    method: 'GET',
    path: '/createAccountDoc',
    handler: handlers.createAccountDoc
})

server.route({
    method: 'GET',
    path: '/getAccountDoc',
    handler: handlers.getAccountDoc
})

server.route({
    method: 'GET',
    path: '/deleteAccountDoc',
    handler: handlers.deleteAccountDoc
})

server.route({
    method: 'GET',
    path: '/traces',
    handler: handlers.traces
})

server.route({
    method: 'GET',
    path: '/badRequest',
    handler: handlers.badRequest
})

server.route({
    method: 'GET',
    path: '/internal',
    handler: handlers.serverError
})

server.route({
    method: '*',
    path: '/{any*}',
    handler: handlers.notFound
}
)

exports.init = async () => {

    await server.initialize()
    logAndWriteToLogger(`Server initialized at: ${server.info.uri}`)
    return server
}

exports.start = async () => {

    await server.start()
    logAndWriteToLogger(`Server running at: ${server.info.uri}`)
    return server
}

process.on('unhandledRejection', (err) => {

    console.log(err)
    process.exit(1)
})


// async function startServer() {
//     const PORT = await envVariable.getSecret("PORT");
//     // Rest of your server code here
//   }