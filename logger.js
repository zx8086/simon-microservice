const winston = require('winston')

const options = {
  file: 
  {
    // level: process.env.LOG_LEVEL || 'debug',
    // levels: winston.config.npm.levels,
    filename: './logs/esquire-microservice.log',
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  },
  console: {
    level: 'error',
    levels: winston.config.npm.levels,
    handleExceptions: true,
    format: winston.format.cli()
  },
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level} [${info.message}] trace.id=${info.trace_id} span.id=${info.span_id} transaction.id=${info.transaction_id}`
   )
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
