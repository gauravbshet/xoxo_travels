-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "visaAssistance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "esimRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "flightAssistance" BOOLEAN NOT NULL DEFAULT false;
