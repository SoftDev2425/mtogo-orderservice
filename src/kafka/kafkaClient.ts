import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'mtogo-orderservice',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
});

export default kafka;
