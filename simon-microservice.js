"use strict";

const dotenv = require("dotenv");
dotenv.config();

// const instrument = require("@aspecto/opentelemetry");
// const aspectoAuth = process.env.ASPECTO_API_KEY;

const logger = require("./logger");
// const { setLogger } = instrument({
//   local: true,
//   logger,
//   aspectoAuth,
//   serviceName: "simon-microservice",
//   env: "Production",
//   writeSystemLogs: true,
//   // exportBatchSize: 100,
//   samplingRatio: 1.0,
//   disableAspecto: false,
// });

// setLogger(logger);

const { IncomingWebhook } = require("@slack/webhook");
const slack = new IncomingWebhook(process.env.SLACK_INCOMING_WEBHOOK_URL);

const { Twilio } = require("twilio");
const axios = require("axios").default;
const httpLogger = require("./httpLogger");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: false });
// const bodyParser = require('body-parser')
// const parseForm = bodyParser.urlencoded({ extended: false })

const kafkaInst = require("./kafka");

const PORT = process.env.PORT;

const express = require("express");
const app = express();
app.disable("x-powered-by");

app.use(httpLogger);
app.use(cookieParser());

async function sendMessage(message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const senderPhone = process.env.TWILIO_PHONE_NUMBER;
  const receiverPhone = process.env.TWILIO_PHONE_RECIPIENT;
  const client = new Twilio(accountSid, authToken);
  const response = await client.messages.create({
    body: message,
    from: senderPhone,
    to: receiverPhone,
  });
  console.log(response);
}

  const consumeMessages = async () => {
    const consumer = kafkaInst.consumer({ groupId: process.env.GROUP_ID })
    await consumer.connect();
    await consumer.subscribe({
      topic: process.env.TOPIC,
      fromBeginning: true,
    });    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          value: message.value.toString(),
        })
      },
    });
    await consumer.disconnect();
   }

app.get("/", csrfProtection, function (_req, res) {
  logger.debug('This is the "/" route.');
  logger.info("Welcome to Simon Microservice");
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end("Welcome to Simon Microservice");
  // pass the csrfToken to the view
  res.render("send", { csrfToken: _req.csrfToken() });
});

app.get("/twilio", function (_req, res) {
  logger.debug('This is the "/twilio" route.');
  logger.info("Send SMS Message via Twilio API");
  sendMessage("Hello There!");
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end("Send SMS Message via Twilio API");
});

app.get("/produce", async (_req, res) => {
  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
  const result = await axios({
    method: "GET",
    url: "https://programming-quotes-api.herokuapp.com/quotes/random",
  });

  console.log(result);

  const { id, author, en: quote } = result.data;
  res.send(`${id} - "${quote}" - ${author}`);

  logger.info("Display the Quote to Browser");

  await axios({
    method: "POST",
    url: "https://siobytes-elk.ent.eu-central-1.aws.cloud.es.io/api/ws/v1/sources/62a1cfaa91109cf4ff0e9907/documents/bulk_create",
    headers: { authorization: "Bearer m92jikugtwfk55qj9mj58y8n" },
    data: [
      {
        id: `${id}`,
        author: `${author}`,
        quote: `${quote}`,
        url: `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
        description:
          "Programming quotes from programming-quotes-api.herokuapp.com",
      },
    ],
  })
    .then(function (response) {
      logger.info(
        "Posting the Quote to Workplace Search Custom Content Database"
      );
      console.log(response);
    })
    .catch(function (error) {
      logger.error(
        "Failed to post the Quote to the Workplace Search Custom Database"
      );
      logger.error("Application Error - ", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        "Failed to post the Quote to the Workplace Search Custom Database"
      );
      console.log(error);
    })
    .then(function () {
      // always executed
      logger.debug('This is the "/quotes" route.');
      logger.debug("Post to Workplace Search Custom Database");
    });

    const produceMessages = async () => {
      const producer = kafkaInst.producer();
      await producer.connect();
      await producer.send({
        topic: process.env.TOPIC,
        messages: [
          {
            key: `${id}`,
            value: JSON.stringify({
              quoteId: `${id}`,
              author: `${author}`,
              quote: `${quote}`,
              url: `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
              description:
                "Programming quotes from programming-quotes-api.herokuapp.com",
            }),
          },
        ],
      });
      await producer.disconnect();
    }
    await produceMessages();

  logger.info("Posting the Quote to Kafka Quotes Topic");

  const text = `:books: "${quote}" - ${author}`;
  await slack.send({
    text,
  });
  console.log("Done", slack.data);
  logger.info("Posting message to Slack");
});

app.get("/health", function (_req, res) {
  logger.debug('This is the "/health" route.');
  logger.info("Application is HEALTHY");
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end("Application is HEALTHY");
});

app.get("/consume", async function (_req, res) {
  consumeMessages(message).catch(async (error) => {
    console.error(error);
    try {
      logger.debug("Console Error....");
    } catch (e) {
      console.error("Failed to gracefully disconnect consumer", e);
    }
    res.end("Consumed all Kafka messages...");
    process.exit(1);
  });
  res.end("Consumed all Quotes in the Kafka topic");
});

app.get("/go", async (_req, res) => {
  await axios({
    method: "GET",
    url: "http://192.168.0.9:4000/go",
  })
    .then(function (response) {
      logger.info("Golang Service...");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end("Golang Service...");
      console.log(response);
    })
    .catch(function (error) {
      logger.error("Failed to call Golang Service...");
      logger.error("Application Error - ", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end("Failed to call Golang Service...");
      console.log(`statusCode: ${res.status}`);
      console.log(error);
    })
    .then(function () {
      // always executed
      logger.debug('This is the "/go" route.');
    });
});

app.get("/simon", async (_req, res) => {
  logger.info("Calling Multiple Micro-Services Correlation...");

  await axios({
    method: "GET",
    url: "http://192.168.0.9:3001/owusu",
  })
    .then(function (response) {
      logger.info("Call Multiple Micro-Services Correlation...");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end("Call Multiple Micro-Services Correlation...");
      console.log(response);
    })
    .catch(function (error) {
      logger.error("Failed to call Multiple Micro-Services Correlation...");
      logger.error("Application Error - ", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end("Failed to call Multiple Micro-Services Correlation...");
      console.log(error);
    })
    .then(function () {
      // always executed
      logger.debug('This is the "/simon" route.');
    });
});

app.listen(parseInt(PORT, 10), () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
  logger.info("Starting server.... Process initialized!");
});

process.on("SIGTERM", () => {
  app.close(() => {
    logger.info("Stopping server.... Process terminated!");
    console.log("Process terminated");
  });
});

// "Beware of bugs in the above code; I have only proved it correct, not tried it." - Donald Knuth