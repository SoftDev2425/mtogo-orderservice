import { z } from 'zod';

const deliveryAddressSchema = z.object(
  {
    street: z.string().min(1, 'Street required'),
    city: z.string().min(1, 'City required'),
    zip: z.string().min(1, 'ZIP required'),
    floor: z.string().optional(),
  },
  {
    message:
      'Invalid delivery address object. Required fields: street, city, zip. Optional field: floor',
  },
);

const paymentSchema = z.object(
  {
    method: z.enum(['MASTER_CARD', 'VISA', 'MOBILEPAY', 'PAYPAL']),
  },
  {
    message:
      'Invalid payment method object. Required fields method. Supported methods: MASTER_CARD, VISA, MOBILEPAY, PAYPAL',
  },
);

const createOrderSchema = z.object({
  basketId: z.string().min(1, 'Basket ID required'),
  deliveryAddress: deliveryAddressSchema,
  payment: paymentSchema,
});

export { createOrderSchema };
