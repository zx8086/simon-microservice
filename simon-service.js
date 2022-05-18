"use strict";

const express = require("express");
const app = express();
const PORT = process.env.PORT || "8070";

const twilio = require('twilio');
const dotenv = require('dotenv');
const node_cron = require('node-cron');

dotenv.config();

async function send_message(message){

    // Get the variables
    let accountSid = process.env.TWILIO_ACCOUNT_SID;
    let authToken = process.env.TWILIO_AUTH_TOKEN;
    let senderPhone = process.env.TWILIO_PHONE_NUMBER;

    // Initialize the client
    const client = new twilio(accountSid, authToken);

    // Send a message
    let response = await client.messages.create({
        body: message,
        from: senderPhone,
        to: '+31624879662'
    });

    console.log(response);
}

const axios = require('axios');

const logger = require('./logger')
const { configFromPath } = require('./util');
const httpLogger = require('./httpLogger')

app.use(httpLogger)

// load the cookie-parsing middleware
const cookieParser = require('cookie-parser')
app.use(cookieParser())

const { Kafka } = require('kafkajs');
// const { countAllRequests } = require("./monitoring");
// app.use(countAllRequests());

// Kafka 
const kafka = new Kafka({
 clientId: 'Kafka Microservice',
 brokers: ['localhost:9092','localhost:9093']
})
const consumer = kafka.consumer({ groupId: 'pvh-group' })

const TOPIC_NAME = 'testing';

// POST a predefined message to a Kafka topic
async function produce() {
 const producer = kafka.producer()
 await producer.connect()
 await producer.send({
   topic: TOPIC_NAME,
   messages: [
     { key: 'key1', value: 'Kafka Enablement' },
   ],
 })
}
 
app.get('/errorhandler', (req, res, next) => {
  try {
    throw new Error('Wowza!')
  } catch (error) {
    next(error)
  }
})

app.use(logErrors)
app.use(errorHandler)

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}
function errorHandler (err, req, res, next) {
  res.status(500).send('Error!')
}

app.get("/", (req, res) => {
    logger.debug('This is the "/" route.')
    logger.info('Welcome to OpenTelemetry & Kafka Enablement Demo')
    return res.status(200).send({ message: "Welcome to OpenTelemetry & Kafka Enablement Demo" });
});

app.get("/twilio", (req, res) => {
    logger.debug('This is the "/twilio" route.')
    logger.info('Send SMS Message via Twilio API')
    send_message('Hello There!')
    return res.status(200).send({ message: "Send SMS Message via Twilio API" });
});

let requestCount = 0;
 
app.get('/quotes', async (req, res) => {
  requestCount++;
  logger.debug('This is the "/quotes" route.')
  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com")
  const result = await axios({
    method: 'GET',
    url: 'https://programming-quotes-api.herokuapp.com/quotes/random'
  })

  const { id, author, en: quote } = result.data;
  res.send(`${id} - "${quote}" - ${author}`);

  logger.info("Display the Quote to Browser")

  const resp = await axios({
      method: 'POST',
      url: 'https://enterprise-search.siobytes.com/api/ws/v1/sources/62792164ce144ec6160f323d/documents/bulk_create',
      headers: {'authorization': 'Bearer mhebumy66bbrch47r3sqyzzb'},
      data: [{id : `${id}`, author : `${author}`, quote : `${quote}`, url : `https://programming-quotes-api.herokuapp.com/quotes/${id}`, description : `Programming quotes from programming-quotes-api.herokuapp.com`}]
  });

  logger.info("Posting the Quote to Workplace Search Custom Content Database")


run().then(() => console.log("Done"), err => console.log(err));

async function run() {
  const kafka = new Kafka({ 
    clientId: 'Simon Microservice',
    brokers: ['localhost:9092','localhost:9093'] 
  });

  const producer = kafka.producer();
  await producer.connect();

  await producer.send({
    topic: 'quotes',
    messages: [
    { key : `${id}`, 
      value: JSON.stringify({
          "author": `${author}`,
          "quote": `${quote}`,
          "url": `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
          "description": 'Programming quotes from programming-quotes-api.herokuapp.com'
      })
    },
    ]
  });
  
 logger.info("Posting the Quote to Kafka Quotes Topic")

  const slackToken = 'xoxb-1692025752528-3459045066403-wBcFPiSemZMO6mZWgc61hpGH';
  const url = 'https://slack.com/api/chat.postMessage';
  const text = `${quote} - ${author}`;
  const res = await axios.post(url, {
    channel: '#random',
    text,
  }, { headers: { authorization: `Bearer ${slackToken}` } });

  console.log('Done', res.data);
  logger.info("Posting message to Slack")
}

  // send_message('Sending a message after Quotes')
  // logger.info('Send SMS Message via Twilio API');

})

app.get('/health', (req, res) => {
    logger.debug('This is the "/health" route.')
    logger.info("Application is HEALTHY")
    return res.status(200).send({ message: `Application is HEALTHY` });
});

app.get("/go", async (req, res) => {
    logger.debug('This is the "/go" route.')
    logger.info("Calling Golang Service...")

    const result = await axios({
      method: 'GET',
      url: 'http://192.168.0.9:4000/go'
    })
    return res.status(200).send({ message: "Calling Golang Service..." });
});

app.get('/error', (req, res, next) => {
  try {
    throw new Error('FATAL !')
  } catch (error) {
    logger.debug('This is the "/error" route.')
    logger.error('Application is broken', error)
    res.status(500).send('Error!')
  }
})

app.post("/messages", async (req, res) => {
    logger.debug('This is the "/messages" route.')
    logger.info(`Posted Kafka message to TOPIC - ${TOPIC_NAME}`)
    await produce();
    return res.status(200).send({ message: `Kafka Enablement - Posted Kafka message to TOPIC - ${TOPIC_NAME}` });
});

app.get("/messages", async (req, res) => {
    logger.debug('This is the "/messages" route.')
    logger.info(`Getting Kafka messages to TOPIC - ${TOPIC_NAME}`)

    const run = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic: 'number-topic', fromBeginning: true })

    await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const decodedKey = await registry.decode(message.key)
      const decodedValue = await registry.decode(message.value)
      console.log({ decodedKey, decodedValue })
    },
  })
}
      run().catch(console.error)
});

app.get("/multi", async (req, res) => {
    logger.debug('This is the "/multi" route.')
    logger.info("Calling Multiple Micro-Services Correlation...")

    const result = await axios({
      method: 'GET',
      url: 'http://192.168.0.9:3001/owusu'
    })
    return res.status(200).send({ message: "Calling Multiple Micro-Services Correlation..." });
});

app.use(logErrors)
app.use(errorHandler)

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}
function errorHandler (err, req, res, next) {
  res.status(500).send('Error!')
}

console.log("Server initialized");

app.listen(parseInt(PORT, 10), () => {
 console.log(`Listening for requests on http://localhost:${PORT}`);
});
