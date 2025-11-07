-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SCENARIO_BASED', 'BEHAVIORAL', 'SITUATIONAL');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');

-- CreateTable
CREATE TABLE "competency_questions" (
    "id" TEXT NOT NULL,
    "competency_id" TEXT NOT NULL,
    "level_id" TEXT,
    "question_type" "QuestionType" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT,
    "explanation" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competency_questions_competency_id_idx" ON "competency_questions"("competency_id");

-- CreateIndex
CREATE INDEX "competency_questions_level_id_idx" ON "competency_questions"("level_id");

-- CreateIndex
CREATE INDEX "competency_questions_difficulty_idx" ON "competency_questions"("difficulty");

-- AddForeignKey
ALTER TABLE "competency_questions" ADD CONSTRAINT "competency_questions_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_questions" ADD CONSTRAINT "competency_questions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "proficiency_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
