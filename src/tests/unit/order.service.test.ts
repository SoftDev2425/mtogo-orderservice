// order.service.test.ts
import { createOrder } from '../../services/order.service';
import { Request } from 'express';
import { jest } from '@jest/globals';
// import prisma from '../../../prisma/client';

// Mock dependencies
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockReturnValue({
    producer: jest.fn().mockReturnValue({
      //@ts-expect-error - jest mock
      send: jest.fn().mockResolvedValue([]),
    }),
  }),
  Producer: jest.fn(),
}));

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

  // it('should create an order successfully', async () => {
  //   // Arrange: Mock the fetch calls for basket, payment, and delivery
  //   mockFetch.mockResolvedValueOnce({
  //     json: async () => ({
  //       basket: {
  //         items: [{ price: 10, quantity: 2 }],
  //         customerId: 'customer123',
  //         restaurantId: 'restaurant123',
  //       },
  //     }),
  //     ok: true,
  //   } as Response);

  //   mockFetch.mockResolvedValueOnce({
  //     json: async () => ({ payment: { id: 'payment123' } }),
  //     ok: true,
  //   } as Response);

  //   // Mock Prisma orders.create
  //   //@ts-expect-error - Prisma mock
  //   prisma.orders.create = jest.fn().mockResolvedValue({
  //     id: 'order123',
  //     status: 'YOUR_FOOD_IS_BEING_PREPARED',
  //     customerId: 'customer123',
  //     restaurantId: 'restaurant123',
  //     totalAmount: 20,
  //     paymentIntentId: 'payment123',
  //     note: null,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     deliveryAddressesId: 'address123',
  //   });

  //   // Act
  //   const result = await createOrder(mockRequest, {
  //     basketId,
  //     deliveryAddress,
  //     payment: {
  //       method: 'VISA',
  //     },
  //   });

  //   // Assert: Verify that the order was created successfully
  //   expect(result).toMatchObject({
  //     id: 'order123',
  //     status: 'YOUR_FOOD_IS_BEING_PREPARED',
  //   });

  //   // Verify fetch calls were made
  //   expect(mockFetch).toHaveBeenCalledTimes(3); // 3 fetch calls (basket, payment, delivery)
  //   expect(prisma.orders.create).toHaveBeenCalled();
  // });

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
      { price: 10, quantity: 1 },
      { price: 20, quantity: 2 },
    ];
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Assert
    expect(totalPrice).toBe(50);
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
