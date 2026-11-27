-- Indexes for the queries that run most under real traffic.
-- Small tables today, so plain CREATE INDEX is fine (takes milliseconds).

CREATE INDEX IF NOT EXISTS "Booking_groupTripId_status_idx" ON "Booking"("groupTripId", "status");
CREATE INDEX IF NOT EXISTS "Booking_packageId_idx" ON "Booking"("packageId");
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Verification_userId_status_idx" ON "Verification"("userId", "status");
CREATE INDEX IF NOT EXISTS "PartnerTrip_userId_active_idx" ON "PartnerTrip"("userId", "active");
CREATE INDEX IF NOT EXISTS "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_reportedId_idx" ON "Report"("reportedId");
CREATE INDEX IF NOT EXISTS "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
CREATE INDEX IF NOT EXISTS "Participant_userId_idx" ON "Participant"("userId");
CREATE INDEX IF NOT EXISTS "Block_blockedId_idx" ON "Block"("blockedId");
CREATE INDEX IF NOT EXISTS "Review_approved_createdAt_idx" ON "Review"("approved", "createdAt");
