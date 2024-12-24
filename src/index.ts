import dotenv from 'dotenv';
import createServer from './utils/server';
import prisma from '../prisma/client';
import { initializeProducer, shutdownProducer } from './utils/produceEvent';
import startConsumers from './kafka/app';
import { gracefulShutdown } from './utils/gracefulShutdown';

dotenv.config();

export const app = createServer();
const port = process.env.PORT || 8000;

async function main() {
  app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
  });
}

main()
  .then(async () => {
    await prisma.$connect();
    await initializeProducer();
    await startConsumers();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    await shutdownProducer();
    process.exit(1);
  });

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
