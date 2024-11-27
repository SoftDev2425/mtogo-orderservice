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

async function fetchBasket(req: Request, basketId: string) {
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

    const data = (await response.json()) as { basket: Basket };

    if (!response.ok) {
      throw new Error("Couldn't fetch basket");
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
    await processPayment(req, {
      amount: totalPrice,
      address: deliveryAddress,
      payment,
    });


    // TODO: process payment above should at least return stripe payment intent id

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

    // handle clear basket (that restaurantservice will pick up)
    // await fetch(
    //   `${process.env.RESTAURANT_SERVICE_URL}/api/basket/${basketId}/clear`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'x-user-role': req.role || '',
    //       'x-user-id': req.userId || '',
    //       'x-user-email': req.email || '',
    //     },
    //   },
    // );

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

    console.log('getRestaurantData', getRestaurantData);

    // produce email event (that notificationservice will pick up)
    await produceEvent('emailNotification_orderCreated', {
      recipentEmail: req.email,
      orderId: order.id,
      restaurantData: getRestaurantData.restaurant,
      deliveryAddress,
      menuItems: basket.items,
    });

    // produce order event (that deliveryservice will pick up)
    // await produceEvent('deliveryService_orderCreated', {
    //   orderId: order.id,
    //   customerId: basket.customerId,
    //   restaurantId: basket.restaurantId,
    //   deliveryAddress,
    //   menuItems: basket.items,
    // });

    // on failure send error message to client
  } catch (error) {
    throw new Error(`Failed to create order: ${(error as Error).message}`);
  }
}

export { createOrder };
