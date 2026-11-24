-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "groupTripId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_groupTripId_email_key" ON "Waitlist"("groupTripId", "email");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_groupTripId_fkey" FOREIGN KEY ("groupTripId") REFERENCES "GroupTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
