export type IOrder = {
  basketId: string;
  deliveryAddress: {
    recipentName: string;
    street: string;
    city: string;
    zip: string;
    floor?: string;
  };
  payment: {
    method: 'MASTER_CARD' | 'VISA' | 'MOBILEPAY' | 'PAYPAL';
  };
};

export type OrderStatusUpdateEvent = {
  orderId: string;
  status:
    | 'YOUR_FOOD_IS_BEING_PREPARED'
    | 'YOUR_FOOD_IS_READY_FOR_PICKUP'
    | 'YOUR_FOOD_IS_ON_THE_WAY'
    | 'YOUR_FOOD_HAS_BEEN_DELIVERED'
    | 'YOUR_ORDER_HAS_BEEN_CANCELLED';
};
