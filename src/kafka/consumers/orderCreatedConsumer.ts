import { EachMessagePayload } from 'kafkajs';
import { createConsumer } from '../consumerManager';
import { produceEvent } from '../../utils/produceEvent';
import { handleUpdateOrderStatus } from '../../services/order.service';

export async function orderStatusUpdateConsumer() {
  const consumer = await createConsumer('deliveryService_emailConsumer');

  await consumer.subscribe({
    topic: 'deliveryService_orderCreated',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        console.log(topic, partition, message);

        const value = message.value?.toString();

        if (value) {
          const event = JSON.parse(value);

          console.log(
            `orderStatusUpdateConsumer received message from topic: ${topic}`,
            event,
          );

          await handleUpdateOrderStatus(event);

          // produce notification event
          await produceEvent(
            'notificationService_OrderStatusUpdate',
            {
              orderId: event.orderId,
              status: event.status,
            },
          );
        }

        console.log('Message processed successfully');
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });

  return consumer;
}
