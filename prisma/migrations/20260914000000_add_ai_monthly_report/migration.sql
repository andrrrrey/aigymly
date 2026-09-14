-- Idempotent migration adding the monthly AI report archive.
--
-- AiMonthlyReport stores the full 5-block monthly report shown as cards in the
-- stats calendar. Keyed per user/month; past months are frozen once generated,
-- so this doubles as a permanent archive. Uses IF NOT EXISTS so it is safe
-- against databases previously provisioned with `prisma db push`.

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiMonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiMonthlyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AiMonthlyReport_userId_monthKey_key" ON "AiMonthlyReport"("userId", "monthKey");
