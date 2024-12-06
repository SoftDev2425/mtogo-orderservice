import { shutdownConsumers } from './consumerManager';
import { orderStatusUpdateConsumer } from './consumers/orderStatusUpdateConsumer';

const consumers: { disconnect: () => Promise<void> }[] = [];

async function startConsumers() {
  console.log('Starting Kafka consumers...');

  consumers.push(await orderStatusUpdateConsumer());

  console.log('All consumers started successfully');
}

async function shutdownAll() {
  console.log('Shutting down all consumers...');
  await shutdownConsumers(consumers);
  process.exit(0);
}

process.on('SIGINT', shutdownAll);
process.on('SIGTERM', shutdownAll);

export default startConsumers;
