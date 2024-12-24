import prisma from '../../prisma/client';
import { shutdownProducer } from './produceEvent';

export async function gracefulShutdown() {
  await prisma.$disconnect();
  await shutdownProducer();
  process.exit();
}
