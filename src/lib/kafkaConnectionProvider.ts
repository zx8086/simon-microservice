import { Kafka, type Producer } from 'kafkajs';

let producer: Producer | null = null;

export const getKafkaProducer = async (): Promise<Producer> => {
    try {
        if (!producer) {
            const kafka = new Kafka({
                clientId: 'simon-microservice',
                brokers: ['localhost:29092']
            });

            producer = kafka.producer();
            await producer.connect();

            console.log('Connected to Kafka successfully.');
        }

        return producer;
    } catch (error: any) {
        console.error("Error connecting to Kafka:", error);
        throw error;
    }
};