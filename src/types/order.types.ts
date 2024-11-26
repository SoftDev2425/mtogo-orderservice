export type IOrder = {
  basketId: string;
  deliveryAddress: {
    street: string;
    city: string;
    zip: string;
    floor?: string;
  };
  payment: {
    method: 'MASTER_CARD' | 'VISA' | 'MOBILEPAY' | 'PAYPAL';
  };
};
