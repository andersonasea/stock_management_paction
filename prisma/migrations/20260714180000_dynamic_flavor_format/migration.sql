CREATE TABLE "Saveur" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Saveur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Saveur_name_key" ON "Saveur"("name");
CREATE UNIQUE INDEX "Saveur_slug_key" ON "Saveur"("slug");

CREATE TABLE "FormatProduit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "volumeMl" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormatProduit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormatProduit_name_key" ON "FormatProduit"("name");
CREATE UNIQUE INDEX "FormatProduit_slug_key" ON "FormatProduit"("slug");

INSERT INTO "Saveur" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES
  ('flavor_vanille', 'Vanille', 'vanille', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('flavor_arachide', 'Arachide', 'arachide', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "FormatProduit" ("id", "name", "slug", "volumeMl", "isActive", "createdAt", "updatedAt")
VALUES
  ('format_250', '250 ml', 'ml-250', 250, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('format_500', '500 ml', 'ml-500', 500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Product" ADD COLUMN "saveurId" TEXT;
ALTER TABLE "Product" ADD COLUMN "formatId" TEXT;

UPDATE "Product"
SET "saveurId" = CASE
  WHEN "flavor"::text = 'VANILLE' THEN 'flavor_vanille'
  WHEN "flavor"::text = 'ARACHIDE' THEN 'flavor_arachide'
  ELSE 'flavor_vanille'
END;

UPDATE "Product"
SET "formatId" = CASE
  WHEN "format"::text = 'ML_250' THEN 'format_250'
  WHEN "format"::text = 'ML_500' THEN 'format_500'
  ELSE 'format_250'
END;

ALTER TABLE "Product" ALTER COLUMN "saveurId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "formatId" SET NOT NULL;

DROP INDEX IF EXISTS "Product_flavor_format_key";
ALTER TABLE "Product" DROP COLUMN "flavor";
ALTER TABLE "Product" DROP COLUMN "format";

CREATE UNIQUE INDEX "Product_saveurId_formatId_key" ON "Product"("saveurId", "formatId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_saveurId_fkey"
  FOREIGN KEY ("saveurId") REFERENCES "Saveur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_formatId_fkey"
  FOREIGN KEY ("formatId") REFERENCES "FormatProduit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TYPE IF EXISTS "Flavor";
DROP TYPE IF EXISTS "Format";
