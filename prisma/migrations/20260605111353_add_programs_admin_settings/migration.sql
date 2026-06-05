-- Idempotent migration.
--
-- Production (and other long-lived databases) gained `User.sex` and the
-- `Workout` table via `prisma db push` before migrations were used here, so
-- this migration must not fail when those objects already exist. The new
-- objects for this feature are the Program, Admin and Setting tables.
--
-- Note: a brand-new database should be initialised with `prisma db push`
-- (the baseline migration does not yet include `Workout`/`sex`).

-- CreateTable
CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT 'happy',
    "emojiBg" TEXT NOT NULL DEFAULT 'yellow',
    "marker" TEXT NOT NULL DEFAULT 'blue',
    "icon" TEXT,
    "exercises" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "notifyMinutesBefore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");
