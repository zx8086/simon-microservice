import type { QuoteResponse } from './lib/interfaces';
import { saveDataToCapella } from "./lib/capellaWriteOperation";
import { getKafkaProducer } from './lib/kafkaConnectionProvider.ts';

const QUOTABLE_API_URL: string = "https://api.quotable.io/random";
const REQUEST_HEADERS = {
    method: "GET",
    headers: { "Content-Type": "application/json" }
};

export async function fetchQuoteFromAPI(): Promise<QuoteResponse> {
    console.log("Sending request to Quotable API...");

    const response :any = await fetch(QUOTABLE_API_URL, REQUEST_HEADERS);
    const data : QuoteResponse = await response.json();

    // Use the '_id' field of the received data as the docId
    const docId :string = data._id;

    console.log("Received response from Quotable API. Preparing to send data to Kafka...");

    // Prepare and send the data to Kafka
    const producer = await getKafkaProducer();
    try {
        await producer.connect();
        await producer.send({
            topic: 'T_PUBLIC_QUOTES',
            messages: [{ value: JSON.stringify(data) }]
        });
        console.log("Data sent to Kafka topic.");
    } catch (e) {
        console.error(`[kafka-producer -> ${'quotes'}]: broker update failed with ${e}`);
    } finally {
        await producer.disconnect();
    }

    console.log("Storing the data to Couchbase...");

    // Store the data to Couchbase
    await saveDataToCapella(docId, data);

    console.log("Finished storing data to Couchbase.");
    return data;
}