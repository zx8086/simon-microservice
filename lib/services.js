const dotenv = require("dotenv");
dotenv.config();

var couchbase = require('couchbase')
const kafkaInst = require("./kafka");

const axios = require("axios").default;
const logger = require("./logger")

const { IncomingWebhook } = require("@slack/webhook");
const { Twilio } = require("twilio");
  
const slack = new IncomingWebhook(process.env.SLACK_INCOMING_WEBHOOK_URL);

const sendMessageToSlack = async (text) => {
    slack.send({
        text,
    });
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

    logger.debug('This is the "/twilio" route.');
    logger.info("Send SMS Message via Twilio API");
    sendTwilioMessage("Hello There!");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end("Send SMS Message via Twilio API");    

}

exports.kafka = async (req, res) => {

    logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
    const result = await axios({
        method: "GET",
        url: "https://programming-quotes-api.herokuapp.com/quotes/random",
    });

    console.log(result);

    const { id, author, en: quote } = result.data;
    res.send(`${id} - "${quote}" - ${author}`);
  
    logger.info("Display the Quote to Browser");

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
  
  // Get a reference to the default collection, required only for older Couchbase server versions
  //   const defaultCollection = bucket.defaultCollection()
    const collection = bucket.scope('_default').collection('_default')
  
    const quotes = {
      author: author,
      quote: quote,
    }
  
    // Create and store a document
    await collection.upsert(id, quotes, { timeout: 10000 })

    // Load the Document and print it
    // Prints Content and Metadata of the stored Document
    let getQuote = await collection.get(id)
    console.log('Added Quote: ', getQuote)

    const produceMessages = async () => {
        const producer = kafkaInst.producer({
          allowAutoTopicCreation: false,
          transactionTimeout: 30000
      });
        await producer.connect();
        await producer.send({
          topic: process.env.TOPIC,
          messages: [
            {
              key: `${id}`,
              headers: {
                 domain: `Digital-Selling`,
                 brand: `TH`, 
                 context: `Quotes` 
                },
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
        logger.info("Produced Kafka Message")
        await producer.disconnect();
      }
      await produceMessages()
      logger.info("Posting the Quote to Kafka Quotes Topic");
    
      const text = `:books: "${quote}" - ${author}`;
      await sendMessageToSlack(text);
      logger.info("Posting the Quote to Slack");
      console.log("Done", slack.data);
}

exports.consume = async (req, res) => {
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
}

exports.couchbase = async (req, res) => {

  logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
  const result = await axios({
      method: "GET",
      url: "https://programming-quotes-api.herokuapp.com/quotes/random",
  });

  console.log(result);

  const { id, author, en: quote } = result.data;
  res.send(`${id} - "${quote}" - ${author}`);

  logger.info("Display the Quote to Browser");

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

// Get a reference to the default collection, required only for older Couchbase server versions
//   const defaultCollection = bucket.defaultCollection()
  const collection = bucket.scope('_default').collection('_default')

  const quotes = {
    author: author,
    quote: quote,
  }

  // Create and store a document
  await collection.upsert(id, quotes, { timeout: 10000 })

  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  let getQuote = await collection.get(id)
  console.log('Added Quote: ', getQuote)
   
  const text = `:books: "${quote}" - ${author}`;
  await sendMessageToSlack(text);
  logger.info("Posting the Quote to Slack");
  console.log("Done", slack.data);
}

  // await axios({
  //   method: "POST",
  //   url: "https://siobytes-elk.ent.eu-central-1.aws.cloud.es.io/api/ws/v1/sources/62a1cfaa91109cf4ff0e9907/documents/bulk_create",
  //   headers: { authorization: "Bearer m92jikugtwfk55qj9mj58y8n" },
  //   data: [
  //     {
  //       id: `${id}`,
  //       author: `${author}`,
  //       quote: `${quote}`,
  //       url: `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
  //       description:
  //         "Programming quotes from programming-quotes-api.herokuapp.com",
  //     },
  //   ],
  // })
  //   .then(function (response) {
  //     logger.info(
  //       "Posting the Quote to Workplace Search Custom Content Database"
  //     );
  //     console.log(response);
  //   })
  //   .catch(function (error) {
  //     logger.error(
  //       "Failed to post the Quote to the Workplace Search Custom Database"
  //     );
  //     logger.error("Application Error - ", error);
  //     res.statusCode = 500;
  //     res.setHeader("Content-Type", "application/json");
  //     res.end(
  //       "Failed to post the Quote to the Workplace Search Custom Database"
  //     );
  //     console.log(error);
  //   })
  //   .then(function () {
  //     // always executed
  //     logger.debug('This is the "/quotes" route.');
  //     logger.debug("Post to Workplace Search Custom Database");
  //   });
