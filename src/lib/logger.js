const winston = require('winston')

const options = {
  file: 
  {
    level: 'info',
    filename: './logs/simon-microservice.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true, 
  },
  console: {
    level: 'error',
    levels: winston.config.npm.levels,
    handleExceptions: true,
    format: winston.format.cli()
  },
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    // info.transaction_id = 'placeholder-transaction-id'
    return `[${info.timestamp}] [${info.level.toUpperCase()}] - ${info.message} | trace.id=${info.trace_id} span.id=${info.span_id} transaction.id=${info.transaction_id}`
  })
)

const logger = winston.createLogger({
  format,
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false
})

module.exports = logger
