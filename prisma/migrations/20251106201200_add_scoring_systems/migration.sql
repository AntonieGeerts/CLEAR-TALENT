-- CreateTable: scoring_systems
CREATE TABLE "scoring_systems" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "system_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_systems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scoring_systems_tenant_id_idx" ON "scoring_systems"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_systems_tenant_id_system_id_key" ON "scoring_systems"("tenant_id", "system_id");

-- AddForeignKey
ALTER TABLE "scoring_systems" ADD CONSTRAINT "scoring_systems_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: competency_questions - Add scoring system support
ALTER TABLE "competency_questions" ADD COLUMN "scoring_system_id" TEXT;
ALTER TABLE "competency_questions" ADD COLUMN "weight" DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE "competency_questions" ADD COLUMN "score_min" INTEGER;
ALTER TABLE "competency_questions" ADD COLUMN "score_max" INTEGER;
ALTER TABLE "competency_questions" ADD COLUMN "behavioral_anchors" JSONB;

-- CreateIndex
CREATE INDEX "competency_questions_scoring_system_id_idx" ON "competency_questions"("scoring_system_id");

-- AddForeignKey
ALTER TABLE "competency_questions" ADD CONSTRAINT "competency_questions_scoring_system_id_fkey" FOREIGN KEY ("scoring_system_id") REFERENCES "scoring_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
