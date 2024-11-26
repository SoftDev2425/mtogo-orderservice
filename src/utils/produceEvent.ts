import { Kafka, Producer } from 'kafkajs';

let producer: Producer;

async function initializeProducer() {
  const kafka = new Kafka({
    clientId: 'restaurant-order-service',
    brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092', 'kafka:9093'],
  });

  producer = kafka.producer();

  producer.connect().catch(error => {
    console.error('Error connecting to Kafka producer:', error);
    process.exit(1);
  });
}

async function produceEvent(topic: string, message: Record<string, unknown>) {
  if (!producer) {
    throw new Error(
      'Producer is not initialized, Call initializeProducer() first',
    );
  }

  try {
    const serializedMessage = JSON.stringify(message);

    await producer.send({
      topic,
      messages: [{ value: serializedMessage }],
    });

    console.log(`Event produced to topic ${topic}`, message);
  } catch (error) {
    console.error('Error producing event:', error);
    throw error;
  }
}

async function shutdownProducer() {
  if (producer) {
    await producer.disconnect();
    console.log('Producer disconnected');
  }
}

export { initializeProducer, produceEvent, shutdownProducer };
