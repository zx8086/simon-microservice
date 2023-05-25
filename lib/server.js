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
    path: '/createScopes',
    handler: handlers.createScopes
})

server.route({
    method: 'GET',
    path: '/createCollections',
    handler: handlers.createCollections
})

server.route({
    method: 'GET',
    path: '/createIndexes',
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
    path: '/hello/{name}',
    handler: handlers.hello
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
    return server
}

exports.start = async () => {

    await server.start()
    console.log(`Server running at: ${server.info.uri}`)
    logger.info(`Server running at: ${server.info.uri}`)
    return server
}

process.on('unhandledRejection', (err) => {

    console.log(err)
    process.exit(1)
})
