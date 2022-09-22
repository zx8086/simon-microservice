const dotenv = require("dotenv")
dotenv.config()

var couchbase = require('couchbase')
const {kafka, Partitioners} = require("./kafka")
// const Kafka = require('kafkajs');
const axios = require("axios")
const logger = require("./logger")
const { IncomingWebhook } = require("@slack/webhook")
const { Twilio } = require("twilio")
const quote = require('./quote')
const json = require("morgan-json")

const slack = new IncomingWebhook(process.env.SLACK_INCOMING_WEBHOOK_URL);

const sendMessageToSlack = async (text) => {
    slack.send({
        text,
    })
}

exports.twilio = async (req, res) => {

    async function sendTwilioMessage(message) {
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

    logger.info("Send SMS Message via Twilio API");
    sendTwilioMessage("Hello There!");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end("Send SMS Message via Twilio API");    

}

exports.kafka = async (_req, res) => {

    const { SchemaRegistry, SchemaType, readAVSCAsync } = require('@kafkajs/confluent-schema-registry')
    const registry = new SchemaRegistry({ 
      host: process.env.KAFKA_SCHEMA_REGISTRY_HOST,
    },
    {[SchemaType.AVRO]: { noAnonymousTypes: true }}
    )

    const registerValueSchema = async () => {
      try {
      const schema = await readAVSCAsync(`avro/${process.env.TOPIC}-value.avsc`)
      const { id } = await registry.register(schema)
      return id
      } catch (e) {
      console.log(e)
      }
  }

    const schemaValueId = await registerValueSchema()

    logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
    const result = await axios({
        method: "GET",
        url: "https://programming-quotes-api.herokuapp.com/quotes/random",
    });

    
    const { id, author, en: quote } = result.data;
    res.send(`${id} - "${quote}" - ${author}`);
    logger.info("Display the Quote to Browser");

    const produceMessages = async () => {
        const producer = kafka.producer({
          createPartitioner: Partitioners.LegacyPartitioner,
          allowAutoTopicCreation: true,
          transactionTimeout: 30000,
          idempotent: true,
      })
        await producer.connect();

        // const quoteHeader = {
        //   domain: `Digital-Selling`,
        //   brand: `TH`, 
        //   context: `${process.env.TOPIC}`, 
        // }

        var quoteValue = {
          id: `${id}`,
          author: `${author}`,
          quote: `${quote}`,
          // url: `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
          // description: "Programming quotes from programming-quotes-api.herokuapp.com",
          // staticOne: `${id}`,
          // staticTwo: `${id}`,
          // staticThree: `${id}`,
          footer: `Produced by KafkaJS`,
        }

        const encodedValue = await registry.encode(schemaValueId, quoteValue)

        const kafkaMessage = {
          key: `${id}`, 
          value: encodedValue,
          // value: JSON.stringify(quoteValue),
        }

        console.log("QuoteValue -", quoteValue);
        console.log("Typeof -", typeof JSON.stringify(quoteValue))

        // send the message to the previously created topic
        await producer.send({
          topic: `${process.env.TOPIC}`,
          messages: [kafkaMessage],
          acks: -1,
        })

        logger.info("Produced Kafka Message")
        await producer.disconnect()
      }
      await produceMessages()
      logger.info("Posting the Quote to Kafka Quotes Topic");
}

exports.couchbase = async (req, res) => {

  quote.getQuote()
  .then(function (response) {
  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com")

  const { id, author, en: quote } = response.data

  res.send(`${id} - "${quote}" - ${author}`)
  logger.info("Display the Quote to Browser")

  async function connectToCouchbase() {

    const clusterConnStr = process.env.COUCHBASE_CLUSTER_CONN_STR
    const username = process.env.COUCHBASE_USERNAME
    const password = process.env.COUCHBASE_PASSWORD

  const cluster = await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
    timeouts: {
      kvTimeout: 10000, // milliseconds
    },
  })

  const bucketName = 'quotes'
  const bucket = cluster.bucket(bucketName)
  const collection = bucket.scope('_default').collection('_default')

  const quotes = {
    author: author,
    quote: quote,
  }

  await collection.upsert(id, quotes, { expiry: 43200, timeout: 10000 })

  logger.info("Posting the Quote to Couchbase Quotes Bucket")

  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  let theQuote = await collection.get(id)
  console.log('Added Quote: ', theQuote)
   
  const text = `:books: "${quote}" - ${author}`
  await sendMessageToSlack(text)
  logger.info("Posting the Quote to Slack")
  // console.log("Done", slack.data)
  }

  connectToCouchbase()

  })
}

exports.workplace = async (req, res) => {

  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
  const result = await axios({
      method: "GET",
      url: "https://programming-quotes-api.herokuapp.com/quotes/random",
  });

  const { id, author, en: quote } = result.data;
  res.send(`${id} - "${quote}" - ${author}`);

  logger.info("Display the Quote to Browser");

  await axios({
    method: "POST",
    url: "https://enterprise-search.siobytes.com/api/ws/v1/sources/62792164ce144ec6160f323d/documents/bulk_create",
    headers: { authorization: "Bearer mhebumy66bbrch47r3sqyzzb" },
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
      logger.debug('This is the "/workplace" route.');
      logger.debug("Post to Workplace Search Custom Database");
    });

}