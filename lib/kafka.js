const { Kafka, logLevel } = require("kafkajs");

const { KAFKA_USERNAME: username, KAFKA_PASSWORD: password } = process.env;
const sasl = username && password ? { username, password, mechanism: "plain" } : null;
const ssl = !!sasl;

// This creates a client instance that is configured to connect to the Kafka broker provided by
// the environment variable KAFKA_BOOTSTRAP_SERVER
const kafka = new Kafka({
  clientId: "nodejs-kafka-client",
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVER],
  // brokers: ['192.168.0.156:9092'],
  // ssl,
  // sasl,
  // logLevel: "info",
});

module.exports = kafka;