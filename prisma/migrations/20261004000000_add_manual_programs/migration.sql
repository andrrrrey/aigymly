-- Manual program builder metadata and links from scheduled workouts back to
-- their source template. Existing programs are AI-generated and remain active.

ALTER TABLE "Program" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ai';
ALTER TABLE "Program" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "Workout" ADD COLUMN "programId" TEXT REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD COLUMN "programDayId" TEXT;
ALTER TABLE "Workout" ADD COLUMN "programWeek" INTEGER;

CREATE INDEX "Workout_programId_idx" ON "Workout"("programId");
