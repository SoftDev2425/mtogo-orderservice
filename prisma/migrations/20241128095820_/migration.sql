-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('YOUR_FOOD_IS_BEING_PREPARED', 'YOUR_FOOD_IS_READY_FOR_PICKUP', 'YOUR_FOOD_IS_ON_THE_WAY', 'YOUR_FOOD_HAS_BEEN_DELIVERED', 'YOUR_ORDER_HAS_BEEN_CANCELLED');

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "restaurantId" VARCHAR(255) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'YOUR_FOOD_IS_BEING_PREPARED',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveryAddressesId" TEXT NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItems" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAddresses" (
    "id" TEXT NOT NULL,
    "recipentName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "floor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_id_index_order" ON "Orders"("customerId");

-- CreateIndex
CREATE INDEX "restaurant_id_index_order" ON "Orders"("restaurantId");

-- CreateIndex
CREATE INDEX "status_index_order" ON "Orders"("status");

-- CreateIndex
CREATE INDEX "order_id_index_order_items" ON "OrderItems"("orderId");

-- CreateIndex
CREATE INDEX "menu_id_index_order_items" ON "OrderItems"("menuId");

-- CreateIndex
CREATE INDEX "city_index_delivery_addresses" ON "DeliveryAddresses"("city");

-- CreateIndex
CREATE INDEX "zip_index_delivery_addresses" ON "DeliveryAddresses"("zip");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_deliveryAddressesId_fkey" FOREIGN KEY ("deliveryAddressesId") REFERENCES "DeliveryAddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
