"use strict";

const kafkaInst = require("./kafka");

const consumeMessages = async () => {
    const consumer = kafkaInst.consumer({ groupId: client-simon })
    await consumer.connect();
    await consumer.subscribe({
        topic: quotes,
        fromBeginning: true,
    });    
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
        console.log({
            value: message.value.toString(),
        })
        },
    });
}

consumeMessages()
    .catch(async (error) => {
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

// "Beware of bugs in the above code; I have only proved it correct, not tried it." - Donald Knuth