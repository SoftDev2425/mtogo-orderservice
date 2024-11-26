export type BasketItem = {
  id: string;
  title: string;
  quantity: number;
  price: number;
  menuId: string;
  createdAt: string;
  updatedAt: string;
  basketId: string;
};

export type Basket = {
  id: string;
  customerId: string;
  restaurantId: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
