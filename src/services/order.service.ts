import {
  Basket,
  BasketItem,
  DeliveryAddress,
  PaymentMethod,
} from '../types/basket.types';
import prisma from '../../prisma/client';
import { IOrder, OrderStatusUpdateEvent } from '../types/order.types';
import { produceEvent } from '../utils/produceEvent';
import { Request } from 'express';
import { Queue, Worker } from 'bullmq';
import { z } from 'zod';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
};

const orderQueue = new Queue('order-status', { connection });

new Worker(
  'order-status',
  async job => {
    const { orderId, status } = job.data;

    try {
      await prisma.orders.update({
        where: {
          id: orderId,
        },
        data: {
          status,
        },
      });

      produceEvent('orderStatusUpdate', {
        orderId: orderId,
        status,
      });

      if (status === 'YOUR_FOOD_HAS_BEEN_DELIVERED') {
        // produce restuarant payout event (that paymentservice will pick up)
        const order = await prisma.orders.findUnique({
          where: {
            id: orderId,
          },
        });

        if (!order) {
          console.error('Order not found');
          return;
        }

        const delivery = await fetch(
          `${process.env.DELIVERY_SERVICE_URL}/api/delivery/order/${order.id}`,
        );

        if (!delivery.ok) {
          console.error('Error fetching delivery data');
          return;
        }

        const deliveryData = await delivery.json();

        const restaurantData = await fetch(
          `${process.env.AUTH_SERVICE_URL}/api/restaurants/${order.restaurantId}`,
        );

        if (!restaurantData.ok) {
          console.error('Error fetching restaurant data');
          return;
        }

        const restaurant = await restaurantData.json();

        produceEvent('paymentService_Payout', {
          order,
          deliveryData,
          restaurant,
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  },
  { connection },
);

export async function scheduleOrderStatusUpdate(
  orderId: string,
  status:
    | 'YOUR_FOOD_IS_READY_FOR_PICKUP'
    | 'YOUR_FOOD_IS_ON_THE_WAY'
    | 'YOUR_FOOD_HAS_BEEN_DELIVERED',
  delay = 30000,
) {
  await orderQueue.add(
    'update-status',
    {
      orderId,
      status,
    },
    { delay },
  );
}

export async function fetchBasket(req: Request, basketId: string) {
  try {
    const response = await fetch(
      `${process.env.RESTAURANT_SERVICE_URL}/api/basket/${basketId}`,
      {
        method: 'GET',
        headers: {
          'x-user-role': req.role || '',
          'x-user-id': req.userId || '',
          'x-user-email': req.email || '',
        },
      },
    );

    const data = (await response.json()) as {
      basket: Basket | null;
      message: string;
    };

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data.basket;
  } catch (error) {
    throw new Error(`${(error as Error).message}`);
  }
}

async function processPayment(
  req: Request,
  data: {
    amount: number;
    address: DeliveryAddress;
    payment: PaymentMethod;
  },
) {
  try {
    const response = await fetch(
      `${process.env.PAYMENT_SERVICE_URL}/api/payment/order/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': req.role || '',
          'x-user-id': req.userId || '',
          'x-user-email': req.email || '',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error('Error processing payment');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error: ${error.message}`);
    }
    throw new Error('Error processing payment');
  }
}

export async function calculateTotalPrice(items: BasketItem[]) {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}

async function createOrder(
  req: Request,
  { basketId, deliveryAddress, payment }: IOrder,
) {
  try {
    // call restaurant service and retrieve basket
    const basket = await fetchBasket(req, basketId);

    if (!basket || !basket.items || basket.items.length === 0) {
      throw new Error('Basket not found');
    }

    // calculate total price
    const totalPrice = await calculateTotalPrice(basket.items);

    // call payment service to process payment
    const paymentData = (await processPayment(req, {
      amount: totalPrice,
      address: deliveryAddress,
      payment,
    })) as {
      payment: {
        id: string;
      };
    };

    // on success create order in db with status 'YOUR FOOD IS BEING PREPARED'
    const order = await prisma.orders.create({
      data: {
        customerId: basket.customerId,
        restaurantId: basket.restaurantId,
        paymentIntentId: paymentData.payment.id,
        deliveryAddress: {
          create: deliveryAddress,
        },
        totalAmount: totalPrice,
        status: 'YOUR_FOOD_IS_BEING_PREPARED',
        items: {
          create: basket.items.map(item => ({
            menuId: item.menuId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    // handle clear basket (that restaurantservice will pick up)
    const clearBasket = await fetch(
      `${process.env.RESTAURANT_SERVICE_URL}/api/basket/${basketId}/clear`,
      {
        method: 'DELETE',
        headers: {
          'x-user-role': req.role || '',
          'x-user-id': req.userId || '',
          'x-user-email': req.email || '',
        },
      },
    );

    if (!clearBasket.ok) {
      console.error('Failed to clear basket');
    }

    const getRestaurantDataResponse = await fetch(
      `${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/${basket.restaurantId}`,
      {
        method: 'GET',
      },
    );

    const getRestaurantData = (await getRestaurantDataResponse.json()) as {
      restaurant: {
        name: string;
        phone: string;
        street: string;
        city: string;
        zip: string;
        x: number;
        y: number;
      };
    };

    // producing email event (that notificationservice will pick up)
    await produceEvent('emailNotification_orderCreated', {
      recipentEmail: req.email,
      orderId: order.id,
      restaurantData: getRestaurantData.restaurant,
      deliveryAddress,
      menuItems: basket.items,
    });

    // producing order event (that deliveryservice will pick up)
    await produceEvent('deliveryService_orderCreated', {
      orderId: order.id,
      customerId: basket.customerId,
      restaurantData: getRestaurantData.restaurant,
      deliveryAddress,
      menuItems: basket.items,
    });

    // schedule order status updates - currently simulated. Will be made as endpoints in the future
    await scheduleOrderStatusUpdate(order.id, 'YOUR_FOOD_IS_ON_THE_WAY', 15000);
    await scheduleOrderStatusUpdate(
      order.id,
      'YOUR_FOOD_HAS_BEEN_DELIVERED',
      30000,
    );

    return order;
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to create order: ${error}`);
  }
}

async function handleUpdateOrderStatus(event: OrderStatusUpdateEvent) {
  try {
    z.object({
      orderId: z.string(),
      status: z.enum([
        'YOUR_FOOD_IS_BEING_PREPARED',
        'YOUR_FOOD_IS_READY_FOR_PICKUP',
        'YOUR_FOOD_IS_ON_THE_WAY',
        'YOUR_FOOD_HAS_BEEN_DELIVERED',
        'YOUR_ORDER_HAS_BEEN_CANCELLED',
      ]),
    }).parse(event);

    const order = await prisma.orders.findUnique({
      where: {
        id: event.orderId,
      },
    });

    if (!order) {
      console.log('Order not found');
      throw new Error('Order not found');
    }

    if (order.status === 'YOUR_FOOD_HAS_BEEN_DELIVERED') {
      console.log('Order already delivered');
      return order;
    }

    return await prisma.orders.update({
      where: {
        id: event.orderId,
      },
      data: {
        status: event.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
    }

    console.error('Error updating order status:', error);
    throw error;
  }
}
export { createOrder, handleUpdateOrderStatus };
