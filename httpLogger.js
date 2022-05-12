const morgan = require('morgan')
const json = require('morgan-json')
const format = json({method: ':method', url: ':url', status: ':status', contentLength: ':res[content-length]', responseTime: ':response-time', totalTime: ':total-time', user_agent: ':user-agent'})
const logger = require('./logger')

const httpLogger = morgan(format, {stream: { write: (message) => logger.http(message) }})

module.exports = httpLogger
