const dotenv = require("dotenv")
dotenv.config()

// const {kafka, Partitioners} = require("./kafka")
// // const Kafka = require('kafkajs');
// const axios = require("axios")
// const fetch = require("fetch")
// const logger = require("./logger")
// const { IncomingWebhook } = require("@slack/webhook")
// const { Twilio } = require("twilio")
// const quote = require('./quote')
// const json = require("morgan-json")
// const { response } = require("express")

// const slack = new IncomingWebhook("https://hooks.slack.com/services/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");

// const sendMessageToSlack = async (text) => {
//     slack.send({
//         text,
//     })
// }


// exports.kafka = async (_req, res) => {

//     const { SchemaRegistry, SchemaType, readAVSCAsync } = require('@kafkajs/confluent-schema-registry')
//     const registry = new SchemaRegistry({ 
//       host: process.env.KAFKA_SCHEMA_REGISTRY_HOST,
//     },
//     {[SchemaType.AVRO]: { noAnonymousTypes: true }}
//     )

//     const registerValueSchema = async () => {
//       try {
//       const schema = await readAVSCAsync(`avro/${process.env.TOPIC}-value.avsc`)
//       const { id } = await registry.register(schema)
//       return id
//       } catch (e) {
//       console.log(e)
//       }
//   }

//     const schemaValueId = await registerValueSchema()

//     logger.info("Getting a Quote from programming-quotes-api.herokuapp.com");
//     const result = await axios({
//         method: "GET",
//         url: "https://programming-quotes-api.herokuapp.com/quotes/random",
//     });

    
//     const { id, author, en: quote } = result.data;
//     res.send(`${id} - "${quote}" - ${author}`);
//     logger.info("Display the Quote to Browser");

//     const produceMessages = async () => {
//         const producer = kafka.producer({
//           createPartitioner: Partitioners.LegacyPartitioner,
//           allowAutoTopicCreation: true,
//           transactionTimeout: 30000,
//           idempotent: true,
//       })
//         await producer.connect();

//         // const quoteHeader = {
//         //   domain: `Digital-Selling`,
//         //   brand: `TH`, 
//         //   context: `${process.env.TOPIC}`, 
//         // }

//         var quoteValue = {
//           id: `${id}`,
//           author: `${author}`,
//           quote: `${quote}`,
//           // url: `https://programming-quotes-api.herokuapp.com/quotes/${id}`,
//           // description: "Programming quotes from programming-quotes-api.herokuapp.com",
//           // staticOne: `${id}`,
//           // staticTwo: `${id}`,
//           // staticThree: `${id}`,
//           footer: `Produced by KafkaJS`,
//         }

//         const encodedValue = await registry.encode(schemaValueId, quoteValue)

//         const kafkaMessage = {
//           key: `${id}`, 
//           value: encodedValue,
//           // value: JSON.stringify(quoteValue),
//         }

//         console.log("QuoteValue -", quoteValue);
//         console.log("Typeof -", typeof JSON.stringify(quoteValue))

//         await producer.send({
//           topic: `${process.env.TOPIC}`,
//           messages: [kafkaMessage],
//           acks: -1,
//         })

//         logger.info("Produced Kafka Message")
//         await producer.disconnect()
//       }
//       await produceMessages()
//       logger.info("Posting the Quote to Kafka Quotes Topic")
// }
