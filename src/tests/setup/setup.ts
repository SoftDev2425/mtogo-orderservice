// import { initializeProducer, shutdownProducer } from '@/utils/produceEvent';
import prisma from '../../../prisma/client';
import createServer from '../../utils/server';
// import startConsumers from '@/kafka/app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let app: any;

global.beforeAll(async () => {
  app = createServer();
  // await initializeProducer();
  // await startConsumers();
});

global.beforeEach(async () => {
  // clear database from all tables
  await prisma.$transaction([
    prisma.orderItems.deleteMany(),
    prisma.orders.deleteMany(),
    prisma.deliveryAddresses.deleteMany(),
  ]);
});

global.afterAll(async () => {
  console.log('Disconnecting from Prisma...');
  await prisma.$disconnect();
  // await shutdownProducer();
  console.log('Prisma disconnected.');
});
