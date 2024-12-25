import supertest from 'supertest';
import { app } from '../setup/setup';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockReturnValue({
    producer: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue([]),
    }),
  }),
  Producer: jest.fn(),
}));

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue(true), // Mock adding job to the queue
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(), // Mock Worker event listener
    })),
  };
});

describe('Order Service - createOrder', () => {
  it('should throw an error if user is not authenticated', async () => {
    // Arrange

    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send({
        basketId: '123',
        deliveryAddress: {
          recipientName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
        payment: {
          method: 'VISA',
        },
      });

    // Assert
    expect(response.status).toBe(403);
    console.log(response.body);
  });

  it('should throw an error if user is not a customer', async () => {
    // Arrange
    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'restaurant') // user is not a customer
      .send({
        basketId: '123',
        deliveryAddress: {
          recipientName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
        payment: {
          method: 'VISA',
        },
      });

    // Assert
    expect(response.status).toBe(403);
    console.log(response.body);
  });

  it('should throw an error if basket id is not provided', async () => {
    // Arrange
    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'customer')
      .send({
        deliveryAddress: {
          recipentName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
        payment: {
          method: 'VISA',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('basketId');
    expect(response.body.errors[0].message).toBe('Basket ID required');
    console.log(response.body);
  });

  it('should throw an error if delivery address is not provided', async () => {
    // Arrange
    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'customer')
      .send({
        basketId: '123',
        payment: {
          method: 'VISA',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('deliveryAddress');
    expect(response.body.errors[0].message).toBe(
      'Invalid delivery address. Required fields: street, city, zip. Optional field: floor',
    );
    console.log(response.body);
  });

  it('should throw an error if payment is not provided', async () => {
    // Arrange
    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'customer')
      .send({
        basketId: '123',
        deliveryAddress: {
          recipentName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('payment');
    expect(response.body.errors[0].message).toBe(
      'Invalid payment method object. Required fields method. Currently supported payment methods: MASTER_CARD & VISA',
    );
    console.log(response.body);
  });

  it("should throw an error if payment method is not 'VISA' or 'MASTER_CARD'", async () => {
    // Arrange
    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'customer')
      .send({
        basketId: '123',
        deliveryAddress: {
          recipentName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
        payment: {
          method: 'AMEX',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('payment.method');
    expect(response.body.errors[0].message).toBe(
      "Invalid enum value. Expected 'MASTER_CARD' | 'VISA', received 'AMEX'",
    );
    console.log(response.body);
  });

  it('should throw an error if basket is empty', async () => {
    // Arrange: Mock the fetch calls for basket
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        basket: {
          message: 'Basket not found',
        },
      }),
      ok: true,
    } as Response);

    // Act
    const response = await supertest(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'customer')
      .send({
        basketId: '123',
        deliveryAddress: {
          recipentName: 'John Doe',
          street: '123 Main St',
          city: 'Springfield',
          zip: '62701',
          floor: '3rd',
        },
        payment: {
          method: 'VISA',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Failed to create order: Error: Basket not found',
    );
    console.log(response.body);
  });
});
