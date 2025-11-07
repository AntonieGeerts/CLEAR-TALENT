-- AlterTable: competency_questions - Add proficiency level support and rating options
ALTER TABLE "competency_questions" ADD COLUMN "proficiency_level_id" TEXT;
ALTER TABLE "competency_questions" ADD COLUMN "rating_options" JSONB;

-- CreateIndex
CREATE INDEX "competency_questions_proficiency_level_id_idx" ON "competency_questions"("proficiency_level_id");

-- AddForeignKey
ALTER TABLE "competency_questions" ADD CONSTRAINT "competency_questions_proficiency_level_id_fkey" FOREIGN KEY ("proficiency_level_id") REFERENCES "proficiency_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
