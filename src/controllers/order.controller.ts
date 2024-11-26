import { createOrder } from '../services/order.service';
import { createOrderSchema } from '../validations/createOrderSchema';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

async function handleCreateOrder(req: Request, res: Response) {
  try {
    const { basketId, deliveryAddress, payment } = req.body;

    // validate input
    createOrderSchema.parse({
      basketId,
      deliveryAddress,
      payment,
    });

    // create order
    const order = await createOrder(req, {
      basketId,
      deliveryAddress,
      payment,
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({ errors: errorMessages });
    } else if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

export default {
  handleCreateOrder,
};
