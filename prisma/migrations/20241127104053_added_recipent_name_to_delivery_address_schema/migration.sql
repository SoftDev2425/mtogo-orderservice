/*
  Warnings:

  - Added the required column `recipentName` to the `DeliveryAddresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryAddresses" ADD COLUMN     "recipentName" TEXT NOT NULL;
