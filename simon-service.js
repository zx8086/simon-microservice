"use strict";

const twilio = require('twilio')
const dotenv = require('dotenv')
const node_cron = require('node-cron')
const axios = require('axios').default;
const logger = require('./logger')
const { configFromPath } = require('./util')
const httpLogger = require('./httpLogger')
const cookieParser = require('cookie-parser')
const { Kafka } = require('kafkajs')

dotenv.config();

const PORT = process.env.PORT

let express = require('express');
let app = express(); // Sensitive
app.disable("x-powered-by");

app.use(httpLogger)
app.use(cookieParser())

const cdc = new Kafka({
 clientId: 'Kafka Microservice',
 brokers: ['localhost:9092','localhost:9093']
})
const consumer = cdc.consumer({ groupId: 'pvh-group' })

const TOPIC_NAME = 'testing';

async function produce() {
 const producer = cdc.producer()
 await producer.connect()
 await producer.send({
   topic: TOPIC_NAME,
   messages: [
     { key: 'key1', value: 'Kafka Enablement' },
   ],
 })
}

async function send_message(message){

  let accountSid = process.env.TWILIO_ACCOUNT_SID;
  let authToken = process.env.TWILIO_AUTH_TOKEN;
  let senderPhone = process.env.TWILIO_PHONE_NUMBER;
  let receiverPhone = process.env.TWILIO_PHONE_RECIPIENT;

  const client = new twilio(accountSid, authToken);

  let response = await client.messages.create({
      body: message,
      from: senderPhone,
      to: receiverPhone
  });

  console.log(response);
}

app.get("/", function (_req, res) {
    logger.debug('This is the "/" route.')
    logger.info('Welcome to Simon Microservice')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end('Welcome to Simon Microservice')
});

app.get("/twilio", function (_req, res) {
    logger.debug('This is the "/twilio" route.')
    logger.info('Send SMS Message via Twilio API')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end('Send SMS Message via Twilio API')
});
 
app.get('/quotes', async (_req, res) => {
  logger.debug('This is the "/quotes" route.')
  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com")
  const result = await axios({
    method: 'GET',
    url: 'https://programming-quotes-api.herokuapp.com/quotes/random'
  })

 console.log(result);

  const { id, author, en: quote } = result.data;
  res.send(`${id} - "${quote}" - ${author}`);

  logger.info("Display the Quote to Browser")

  const resp = await axios({
      method: 'POST',
      url: 'https://siobytes-elk.ent.eu-central-1.aws.cloud.es.io/api/ws/v1/sources/62a1cfaa91109cf4ff0e9907/documents/bulk_create',
      headers: {'authorization': 'Bearer m92jikugtwfk55qj9mj58y8n'},
      data: [{id : `${id}`, author : `${author}`, quote : `${quote}`, url : `https://programming-quotes-api.herokuapp.com/quotes/${id}`, description : `Programming quotes from programming-quotes-api.herokuapp.com`}]
  });

 console.log(resp);

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
  const slackRes = await axios.post(url, {
    channel: '#random',
    text,
  }, { headers: { authorization: `Bearer ${slackToken}` } });

  console.log('Done', slackRes.data);
  logger.info("Posting message to Slack")
}

})

app.get('/health', function (_req, res) {
    logger.debug('This is the "/health" route.')
    logger.info("Application is HEALTHY")
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end('Application is HEALTHY')
});

app.get("/go", async (_req, res) => {
    logger.debug('This is the "/go" route.')
    logger.info("Calling Golang Service...")

    await axios({
      method: 'GET',
      url: 'http://192.168.0.9:4000/go'
    })
    return res.status(200).send({ message: "Calling Golang Service..." });
});

app.get('/error', function (_req, res)  {
  try {
    throw new error('FATAL !')
  } catch (error) {
    logger.debug('This is the "/error" route.')
    logger.error('Application is broken', error)
    res.status(500).send('error!')
  }
})

app.get("/simon", async (_req, res) => {
    logger.debug('This is the "/simon" route.')
    logger.info("Calling Multiple Micro-Services Correlation...")

    await axios({
      method: 'GET',
      url: 'http://192.168.0.9:3001/owusu'
    })
    return res.status(200).send({ message: "Calling Multiple Micro-Services Correlation..." });
});

console.log("Server initialized");

app.listen(parseInt(PORT, 10), () => {
 console.log(`Listening for requests on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
