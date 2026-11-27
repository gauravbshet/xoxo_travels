-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "invoiceDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_invoiceNumber_key" ON "Booking"("invoiceNumber");

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "fy" TEXT NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("fy")
);
