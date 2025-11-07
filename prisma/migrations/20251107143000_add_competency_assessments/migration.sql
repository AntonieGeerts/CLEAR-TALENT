-- CreateEnum for AssessmentStatus if not exists
DO $$ BEGIN
  CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable competency_assessments
CREATE TABLE IF NOT EXISTS "competency_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "competency_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "answered_count" INTEGER NOT NULL DEFAULT 0,
    "total_score" DOUBLE PRECISION,
    "average_score" DOUBLE PRECISION,
    "results" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable assessment_responses
CREATE TABLE IF NOT EXISTS "assessment_responses" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "score" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "competency_assessments_tenant_id_idx" ON "competency_assessments"("tenant_id");
CREATE INDEX IF NOT EXISTS "competency_assessments_user_id_idx" ON "competency_assessments"("user_id");
CREATE INDEX IF NOT EXISTS "competency_assessments_status_idx" ON "competency_assessments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "assessment_responses_assessment_id_idx" ON "assessment_responses"("assessment_id");
CREATE INDEX IF NOT EXISTS "assessment_responses_question_id_idx" ON "assessment_responses"("question_id");

-- CreateUnique
CREATE UNIQUE INDEX IF NOT EXISTS "assessment_responses_assessment_id_question_id_key" ON "assessment_responses"("assessment_id", "question_id");

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "competency_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "competency_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
