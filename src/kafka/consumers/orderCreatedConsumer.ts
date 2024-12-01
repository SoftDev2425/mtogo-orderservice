import { EachMessagePayload } from 'kafkajs';
import { createConsumer } from '../consumerManager';
import { produceEvent } from '../../utils/produceEvent';
import { handleUpdateOrderStatus } from '../../services/order.service';

export async function orderStatusUpdateConsumer() {
  const consumer = await createConsumer('mtogo-orderStatusUpdateConsumer');

  await consumer.subscribe({
    topic: 'orderStatusUpdate',
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

          const order = await handleUpdateOrderStatus(event);

          console.log('Order status updated:', order);

          // produce notification event
          await produceEvent('notificationService_OrderStatusUpdate', {
            order,
            status: event.status,
          });
        }

        console.log('Message processed successfully');
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });

  return consumer;
}
