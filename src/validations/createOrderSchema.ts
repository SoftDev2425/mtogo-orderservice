import { z } from 'zod';

const deliveryAddressSchema = z.object(
  {
    recipentName: z
      .string({
        message: 'Recipient name required',
      })
      .min(1, 'Recipient name required'),
    street: z
      .string({
        message: 'Street required',
      })
      .min(1, 'Street required'),
    city: z
      .string({
        message: 'City required',
      })
      .min(1, 'City required'),
    zip: z
      .string({
        message: 'ZIP required',
      })
      .min(1, 'ZIP required'),
    floor: z.string().optional(),
  },
  {
    message:
      'Invalid delivery address. Required fields: street, city, zip. Optional field: floor',
  },
);

const paymentSchema = z.object(
  {
    method: z.enum(['MASTER_CARD', 'VISA']),
  },
  {
    message:
      'Invalid payment method object. Required fields method. Currently supported payment methods: MASTER_CARD & VISA',
  },
);

const createOrderSchema = z.object({
  basketId: z
    .string({
      message: 'Basket ID required',
    })
    .min(1, 'Basket ID required'),
  deliveryAddress: deliveryAddressSchema,
  payment: paymentSchema,
});

export { createOrderSchema };
