-- AlterEnum CostType: FIXED/VARIABLE → new accounting categories
CREATE TYPE "CostType_new" AS ENUM ('DISTRIBUTION', 'COMMERCIAL', 'ADMINISTRATIVE', 'OTHER');

ALTER TABLE "Cost" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Cost" ALTER COLUMN "type" TYPE TEXT USING (
  CASE
    WHEN "type"::text = 'FIXED' THEN 'ADMINISTRATIVE'
    WHEN "type"::text = 'VARIABLE' THEN 'DISTRIBUTION'
    ELSE 'OTHER'
  END
);

DROP TYPE "CostType";
ALTER TYPE "CostType_new" RENAME TO "CostType";
ALTER TABLE "Cost" ALTER COLUMN "type" TYPE "CostType" USING "type"::"CostType";

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('L', 'KG', 'PCS');

-- AlterTable Production
ALTER TABLE "Production" ADD COLUMN IF NOT EXISTS "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "productionCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable RawMaterial
CREATE TABLE IF NOT EXISTS "RawMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "MaterialUnit" NOT NULL DEFAULT 'PCS',
    "stockQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterial_name_key" ON "RawMaterial"("name");

-- CreateTable Purchase
CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawMaterialId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProductRecipeItem
CREATE TABLE IF NOT EXISTS "ProductRecipeItem" (
    "id" TEXT NOT NULL,
    "quantityPerUnit" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    CONSTRAINT "ProductRecipeItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductRecipeItem_productId_rawMaterialId_key" ON "ProductRecipeItem"("productId", "rawMaterialId");

-- CreateTable ProductionConsumption
CREATE TABLE IF NOT EXISTS "ProductionConsumption" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "productionId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    CONSTRAINT "ProductionConsumption_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductRecipeItem" ADD CONSTRAINT "ProductRecipeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductRecipeItem" ADD CONSTRAINT "ProductRecipeItem_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductionConsumption" ADD CONSTRAINT "ProductionConsumption_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductionConsumption" ADD CONSTRAINT "ProductionConsumption_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
