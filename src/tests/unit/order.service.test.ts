// order.service.test.ts
import {
  calculateTotalPrice,
  createOrder,
  fetchBasket,
  handleUpdateOrderStatus,
} from '../../services/order.service';
import { Request } from 'express';
import { jest } from '@jest/globals';
import prisma from '../../../prisma/client';
import { OrderStatusUpdateEvent } from '../../types/order.types';

// Mock dependencies
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.mock('kafkajs', () => {
  const mockProducer = {
    //@ts-expect-error - jest mock
    send: jest.fn().mockResolvedValue([]),
    //@ts-expect-error - jest mock
    connect: jest.fn().mockResolvedValue(undefined),
    //@ts-expect-error - jest mock
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  return {
    Kafka: jest.fn().mockReturnValue({
      producer: jest.fn(() => mockProducer),
    }),
    Producer: jest.fn(),
  };
});

// Mock BullMQ Queue and Worker
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      //@ts-expect-error - jest mock
      add: jest.fn().mockResolvedValue(true), // Mock adding job to the queue
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(), // Mock Worker event listener
    })),
  };
});

jest.mock(
  '../../utils/produceEvent',
  () => ({
    produceEvent: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '../../utils/scheduleOrderStatusUpdate',
  () => ({
    scheduleOrderStatusUpdate: jest.fn(),
  }),
  { virtual: true },
);

describe('Order Service - createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = {
    role: 'customer',
    userId: 'user123',
    email: 'test@example.com',
  } as unknown as Request;

  const basketId = 'basket123';
  const deliveryAddress = {
    recipentName: 'John Doe',
    street: '123 Main St',
    city: 'Sample City',
    zip: '12345',
  };

  it('should create an order successfully', async () => {
    // Arrange: Mock the fetch calls for basket, payment, and delivery
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        basket: {
          items: [{ price: 10, quantity: 2 }],
          customerId: 'customer123',
          restaurantId: 'restaurant123',
        },
      }),
      ok: true,
    } as Response);

    mockFetch.mockResolvedValueOnce({
      json: async () => ({ payment: { id: 'payment123' } }),
      ok: true,
    } as Response);

    // Mock Prisma orders.create
    const mockOrder = {
      id: 'order123',
      customerId: 'customer123',
      restaurantId: 'restaurant123',
      status: 'YOUR_FOOD_IS_BEING_PREPARED',
      totalAmount: 20,
      paymentIntentId: 'payment123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryAddressesId: 'delivery123',
      items: [
        {
          id: 'item123',
          orderId: 'order123',
          menuId: 'menu123',
          title: 'Item Title',
          quantity: 2,
          price: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      deliveryAddress: {
        id: 'delivery123',
        recipentName: 'John Doe',
        street: '123 Main St',
        city: 'Sample City',
        zip: '12345',
        floor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // @ts-expect-error - jest mock
    prisma.orders.create = jest.fn().mockResolvedValue(mockOrder);

    // clear basket mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    // mock get restaurant data
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        restaurant: {
          name: 'Sample Restaurant',
          phone: '123-456-7890',
          street: '123 Main St',
          city: 'Sample City',
          zip: '12345',
        },
      }),
      ok: true,
    } as Response);

    // Act
    const result = await createOrder(mockRequest, {
      basketId,
      deliveryAddress,
      payment: {
        method: 'VISA',
      },
    });

    // Assert: Verify that the order was created successfully
    expect(result).toMatchObject({
      id: 'order123',
      status: 'YOUR_FOOD_IS_BEING_PREPARED',
    });

    // Verify fetch calls were made
    expect(mockFetch).toHaveBeenCalledTimes(4); // 4 fetch calls (basket, payment, delivery, clearBasket)
    expect(prisma.orders.create).toHaveBeenCalled();
  });

  it('should throw an error when the basket is not found', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: 'Basket not found' }),
      ok: false,
    } as Partial<Response> as Response);

    // Act & Assert
    await expect(
      createOrder(mockRequest, {
        basketId,
        deliveryAddress,
        payment: { method: 'VISA' },
      }),
    ).rejects.toThrow('Basket not found');
    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.RESTAURANT_SERVICE_URL}/api/basket/${basketId}`,
      expect.any(Object),
    );
  });

  it('should handle payment processing errors', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        basket: { items: [{ price: 10, quantity: 2 }] },
      }),
      ok: true,
    } as Partial<Response> as Response);
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Partial<Response> as Response);

    // Act & Assert
    await expect(
      createOrder(mockRequest, {
        basketId,
        deliveryAddress,
        payment: { method: 'VISA' },
      }),
    ).rejects.toThrow('Error processing payment');
  });

  it('should calculate the total price correctly', async () => {
    // Arrange
    const items = [
      {
        id: 'item123',
        title: 'Item Title',
        quantity: 2,
        price: 10,
        menuId: 'menu123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        basketId: 'basket123',
      },
      {
        id: 'item12',
        title: 'Item Title 2',
        quantity: 4,
        price: 15,
        menuId: 'menu12',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        basketId: 'basket123',
      },
    ];

    const totalPrice = await calculateTotalPrice(items);

    console.log('totalPrice: ', totalPrice);

    // Assert
    expect(totalPrice).toBe(80);
  });

  it('should handle unexpected errors gracefully', async () => {
    // Arrange
    mockFetch.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // Act & Assert
    await expect(
      createOrder(mockRequest, {
        basketId,
        deliveryAddress,
        payment: { method: 'VISA' },
      }),
    ).rejects.toThrow('Unexpected error');
  });
});

describe('Order Service -fetchBasket', () => {
  it('should fetch basket successfully', async () => {
    // Arrange
    const basketId = 'basket123';
    const mockRequest = {
      role: 'customer',
      userId: 'user123',
      email: 'john@doe.com',
    } as unknown as Request;

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        basket: {
          items: [{ price: 10, quantity: 2 }],
          customerId: 'customer123',
          restaurantId: 'restaurant123',
        },
        message: 'Basket fetched successfully',
      }),
      ok: true,
    } as Partial<Response> as Response);

    // Act
    const basket = await fetchBasket(mockRequest, basketId);

    // Assert
    expect(basket).toMatchObject({
      items: [{ price: 10, quantity: 2 }],
      customerId: 'customer123',
      restaurantId: 'restaurant123',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.RESTAURANT_SERVICE_URL}/api/basket/${basketId}`,
      expect.objectContaining({
        method: 'GET',
        headers: {
          'x-user-role': 'customer',
          'x-user-id': 'user123',
          'x-user-email': 'john@doe.com',
        },
      }),
    );
  });

  it('should throw an error if the API returns a non-OK response', async () => {
    // Arrange
    const basketId = 'basket123';
    const mockRequest = {
      role: 'customer',
      userId: 'user123',
      email: 'john@doe.com',
    } as unknown as Request;

    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: 'Basket not found' }),
      ok: false,
    } as Partial<Response> as Response);

    // Act & Assert
    await expect(fetchBasket(mockRequest, basketId)).rejects.toThrow(
      'Basket not found',
    );
  });

  it('should return null if the basket is not found in the response', async () => {
    // Arrange
    const basketId = 'basket123';
    const mockRequest = {
      role: 'customer',
      userId: 'user123',
      email: 'john@doe.com',
    } as unknown as Request;

    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        basket: null,
        message: 'Basket not found',
      }),
      ok: true,
    } as Partial<Response> as Response);

    // Act
    const basket = await fetchBasket(mockRequest, basketId);

    // Assert
    expect(basket).toBeNull();
  });
});

describe('Order Service - handleUpdateOrderStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update order status successfully', async () => {
    // Arrange
    const event = {
      orderId: 'order123',
      status: 'YOUR_FOOD_IS_READY_FOR_PICKUP',
    };

    const mockOrder = {
      id: 'order123',
      status: 'YOUR_FOOD_IS_BEING_PREPARED',
    };

    const updatedOrder = {
      id: 'order123',
      status: event.status, // The status we want after the update
    };

    // Mocking Prisma methods
    // @ts-expect-error - jest mock
    prisma.orders.findUnique = jest.fn().mockResolvedValue(mockOrder);
    // @ts-expect-error - jest mock
    prisma.orders.update = jest.fn().mockResolvedValue(updatedOrder);

    // Act
    const result = await handleUpdateOrderStatus(
      event as OrderStatusUpdateEvent,
    );

    // Assert
    expect(prisma.orders.findUnique).toHaveBeenCalledWith({
      where: { id: event.orderId },
    });
    expect(prisma.orders.update).toHaveBeenCalledWith({
      where: { id: event.orderId },
      data: { status: event.status },
    });
    expect(result).toEqual(updatedOrder);
  });

  it('should throw an error if the order is not found', async () => {
    // Arrange
    const event = {
      orderId: 'order123',
      status: 'YOUR_FOOD_IS_BEING_PREPARED',
    };

    // @ts-expect-error - jest mock
    prisma.orders.findUnique = jest.fn().mockResolvedValue(null);

    // Act and Assert
    await expect(
      handleUpdateOrderStatus(event as OrderStatusUpdateEvent),
    ).rejects.toThrow('Order not found');
    expect(prisma.orders.findUnique).toHaveBeenCalledWith({
      where: { id: event.orderId },
    });
  });

  it('should handle unexpected errors gracefully', async () => {});

  it('should handle invalid status values', async () => {});
});

describe('Order Service - clearBasket', () => {});

describe('Order Service - processPayment', () => {});

describe('Order Service - schedule order status update', () => {});
