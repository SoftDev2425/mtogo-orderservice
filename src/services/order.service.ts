import {
  Basket,
  BasketItem,
  DeliveryAddress,
  PaymentMethod,
} from '../types/basket.types';
import prisma from '../../prisma/client';
import { IOrder } from '../types/order.types';
import { produceEvent } from '../utils/produceEvent';
import { Request } from 'express';

async function fetchBasket(req: Request, basketId: string): Promise<Basket> {
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

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = (data as { message: string }).message;
      throw new Error(
        errorMessage
          ? errorMessage
          : `Error fetching basket with id: ${basketId}`,
      );
    }

    return (await response.json()) as Basket;
  } catch (error) {
    throw new Error(`${(error as Error).message}`);
  }
}

async function processPayment(data: {
  amount: number;
  address: DeliveryAddress;
  payment: PaymentMethod;
}) {
  console.log(data);
  // simulate payment processing
  const paymentSuccess = true;
  if (!paymentSuccess) {
    throw new Error('Error processing payment');
  }

  // try {
  //   const response = await fetch(
  //     `${process.env.PAYMENT_SERVICE_URL}/api/payment/process`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //     },
  //   );

  //   if (!response.ok) {
  //     throw new Error('Error processing payment');
  //   }

  //   return await response.json();
  // } catch (error) {
  //   if (error instanceof Error) {
  //     throw new Error(`Error: ${error.message}`);
  //   }
  //   throw new Error('Error processing payment');
  // }
}

async function calculateTotalPrice(items: BasketItem[]) {
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
    await processPayment({
      amount: totalPrice,
      address: deliveryAddress,
      payment,
    });

    // on success create order in db with status 'YOUR FOOD IS BEING PREPARED'
    const order = await prisma.orders.create({
      data: {
        customerId: basket.customerId,
        restaurantId: basket.restaurantId,
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

    // produce email event (that notificationservice will pick up)
    await produceEvent('emailNotification', {
      orderId: order.id,
      customerId: basket.customerId,
    });

    // produce order event (that deliveryservice will pick up)
    await produceEvent('deliveryService', {
      orderId: order.id,
      customerId: basket.customerId,
      restaurantId: basket.restaurantId,
      deliveryAddress,
    });

    // on failure send error message to client
  } catch (error) {
    throw new Error(`Failed to create order: ${(error as Error).message}`);
  }
}

export { createOrder };
