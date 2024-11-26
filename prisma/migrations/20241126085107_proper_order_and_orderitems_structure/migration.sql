/*
  Warnings:

  - The primary key for the `OrderItems` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `productId` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `OrderItems` table. All the data in the column will be lost.
  - The primary key for the `Orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `orderDate` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderStatus` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderTotal` on the `Orders` table. All the data in the column will be lost.
  - Added the required column `menuId` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('YOUR_FOOD_IS_BEING_PREPARED', 'YOUR_FOOD_IS_READY_FOR_PICKUP', 'YOUR_FOOD_IS_ON_THE_WAY', 'YOUR_FOOD_HAS_BEEN_DELIVERED', 'YOUR_ORDER_HAS_BEEN_CANCELLED');

-- DropForeignKey
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_orderId_fkey";

-- AlterTable
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_pkey",
DROP COLUMN "productId",
DROP COLUMN "unitPrice",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "menuId" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orderId" SET DATA TYPE TEXT,
ADD CONSTRAINT "OrderItems_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "OrderItems_id_seq";

-- AlterTable
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_pkey",
DROP COLUMN "orderDate",
DROP COLUMN "orderNumber",
DROP COLUMN "orderStatus",
DROP COLUMN "orderTotal",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customerId" VARCHAR(255) NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "restaurantId" VARCHAR(255) NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'YOUR_FOOD_IS_BEING_PREPARED',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Orders_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Orders_id_seq";

-- CreateIndex
CREATE INDEX "order_id_index_order_items" ON "OrderItems"("orderId");

-- CreateIndex
CREATE INDEX "menu_id_index_order_items" ON "OrderItems"("menuId");

-- CreateIndex
CREATE INDEX "customer_id_index_order" ON "Orders"("customerId");

-- CreateIndex
CREATE INDEX "restaurant_id_index_order" ON "Orders"("restaurantId");

-- CreateIndex
CREATE INDEX "status_index_order" ON "Orders"("status");

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
