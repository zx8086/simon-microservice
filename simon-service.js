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
let app = express();
app.disable("x-powered-by");

app.use(httpLogger)
app.use(cookieParser())

const kafkaInst = new Kafka({
 clientId: 'Kafka Microservice',
 brokers: ['localhost:9092','localhost:9093']
})
const consumer = kafkaInst.consumer({ groupId: 'pvh-group' })

const TOPIC_NAME = 'testing';

async function produce() {
 const producer = kafkaInst.producer()
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

  await axios({
      method: 'POST',
      url: 'https://siobytes-elk.ent.eu-central-1.aws.cloud.es.io/api/ws/v1/sources/62a1cfaa91109cf4ff0e9907/documents/bulk_create',
      headers: {'authorization': 'Bearer m92jikugtwfk55qj9mj58y8n'},
      data: [{id : `${id}`, author : `${author}`, quote : `${quote}`, url : `https://programming-quotes-api.herokuapp.com/quotes/${id}`, description : `Programming quotes from programming-quotes-api.herokuapp.com`}]
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
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

  await axios({
        method: 'GET',
        url: 'http://192.168.0.9:4000/go'
      })
      .then(function (response) {
        logger.info('Golang Service...')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('Golang Service...')
        console.log(response);
      })
      .catch(function (error) {
        logger.error('Failed to call Golang Service...')
        logger.error('Application Error - ', error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end('Failed to call Golang Service...')
        console.log(error);
      })
      .then(function () {
        // always executed
        logger.debug('This is the "/go" route.')
      }); 
});

app.get('/error', function (_req, res)  {
  try {
    throw new error('FATAL !')
  } catch (error) {
    logger.debug('This is the "/error" route.')
    logger.error('Application Error -', error)
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
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
    return res.status(200).send({ message: "Calling Multiple Micro-Services Correlation..." });
});

console.log("Server initialized");

app.listen(parseInt(PORT, 10), () => {
 console.log(`Listening for requests on http://localhost:${PORT}`)
 logger.info('Starting server.... Process initialized!');

});

process.on('SIGTERM', () => {
  server.close(() => {
    logger.info('Stopping server.... Process terminated!');
    console.log('Process terminated');
  });
});
