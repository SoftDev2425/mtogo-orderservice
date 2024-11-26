/*
  Warnings:

  - Added the required column `deliveryAddressesId` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "deliveryAddressesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DeliveryAddresses" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "floor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_index_delivery_addresses" ON "DeliveryAddresses"("city");

-- CreateIndex
CREATE INDEX "zip_index_delivery_addresses" ON "DeliveryAddresses"("zip");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_deliveryAddressesId_fkey" FOREIGN KEY ("deliveryAddressesId") REFERENCES "DeliveryAddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
