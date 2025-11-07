-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('BEHAVIORAL', 'SITUATIONAL', 'TECHNICAL', 'KNOWLEDGE');

-- CreateTable
CREATE TABLE "competency_questions" (
    "id" TEXT NOT NULL,
    "competency_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competency_questions_competency_id_idx" ON "competency_questions"("competency_id");

-- AddForeignKey
ALTER TABLE "competency_questions" ADD CONSTRAINT "competency_questions_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
