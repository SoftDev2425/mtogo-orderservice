export type BasketItem = {
  id: string;
  menuId: string;
  title: string;
  price: number;
  quantity: number;
};

export type Basket = {
  id: string;
  customerId: string;
  restaurantId: string;
  items: BasketItem[];
};

export type DeliveryAddress = {
  street: string;
  city: string;
  zip: string;
  floor?: string;
};

export type PaymentMethod = {
  method: string;
};
