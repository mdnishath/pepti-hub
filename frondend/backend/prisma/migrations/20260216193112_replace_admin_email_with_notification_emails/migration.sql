/*
  Warnings:

  - You are about to drop the column `adminEmail` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "adminEmail",
ADD COLUMN     "contactNotificationEmail" TEXT,
ADD COLUMN     "orderNotificationEmail" TEXT;
