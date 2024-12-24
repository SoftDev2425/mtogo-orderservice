import supertest from 'supertest';
import { app } from '../setup/setup';

describe('Order Service - createOrder', () => {
  it('should throw an error if user is not authenticated', async () => {
    // Arrange

    // Act
    const response = await supertest(app)
      .post('/api/order')
      .set('Content-Type', 'application/json')
      .set('x-user-role', 'restaurant') // user is not authenticated
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
    expect(response.status).toBe(401);
    console.log(response.body);
  });

  it('should throw an error if user is not a customer', async () => {});

  it('should throw an error if basket id is not provided', async () => {});

  it('should throw an error if delivery address is not provided', async () => {});

  it('should throw an error if payment is not provided', async () => {});

  it("should throw an error if payment method is not 'VISA' or 'MASTER_CARD'", async () => {});

  // it("should throw an error if basket is empty", async () => {});
});
