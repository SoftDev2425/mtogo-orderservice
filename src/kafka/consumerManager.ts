import kafka from './kafkaClient';

export async function createConsumer(groupId: string) {
  const consumer = kafka.consumer({ groupId });

  try {
    await consumer.connect();
    console.log(`Kafka consumer connected with groupId: ${groupId}`);
  } catch (error) {
    console.error(
      `Error connecting Kafka consumer with groupId: ${groupId}`,
      error,
    );
    process.exit(1);
  }

  return consumer;
}

export async function shutdownConsumers(
  consumers: Array<{
    disconnect: () => Promise<void>;
  }>,
) {
  for (const consumer of consumers) {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
}
