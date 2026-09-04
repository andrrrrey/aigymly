-- Idempotent migration adding the subscription billing model.
--
-- Introduces Plan, Subscription and Payment tables plus a seed of the three
-- default plans. Uses IF NOT EXISTS / INSERT OR IGNORE so it is safe to apply
-- against databases that were previously provisioned with `prisma db push`.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priceKopecks" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'none',
    "currentPeriodEnd" DATETIME,
    "rebillId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planId" TEXT,
    "orderId" TEXT NOT NULL,
    "tbankPaymentId" TEXT,
    "amountKopecks" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "isRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "raw" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_orderId_key" ON "Payment"("orderId");

-- Seed default plans (499 ₽ / month, 2990 ₽ / 6 months, 4990 ₽ / year).
INSERT OR IGNORE INTO "Plan" ("id", "name", "priceKopecks", "periodDays", "active", "sortOrder", "createdAt", "updatedAt")
VALUES
    ('plan_month', 'Месяц', 49900, 30, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_halfyear', 'Полгода', 299000, 182, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_year', 'Год', 499000, 365, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
