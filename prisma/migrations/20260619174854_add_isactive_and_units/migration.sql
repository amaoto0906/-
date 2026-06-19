/*
  Warnings:

  - Added the required column `updatedAt` to the `FeedingLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductionLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "proteinPct" REAL,
    "fatPct" REAL,
    "unitPrice" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Feed" ("code", "createdAt", "fatPct", "id", "manufacturer", "name", "proteinPct", "unitPrice") SELECT "code", "createdAt", "fatPct", "id", "manufacturer", "name", "proteinPct", "unitPrice" FROM "Feed";
DROP TABLE "Feed";
ALTER TABLE "new_Feed" RENAME TO "Feed";
CREATE UNIQUE INDEX "Feed_code_key" ON "Feed"("code");
CREATE TABLE "new_FeedingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "amountKg" REAL NOT NULL,
    "mealsCount" INTEGER NOT NULL DEFAULT 1,
    "feederUserId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedingLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeedingLog_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeedingLog_feederUserId_fkey" FOREIGN KEY ("feederUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FeedingLog" ("amountKg", "createdAt", "feedId", "feederUserId", "id", "note", "pondId", "recordedAt") SELECT "amountKg", "createdAt", "feedId", "feederUserId", "id", "note", "pondId", "recordedAt" FROM "FeedingLog";
DROP TABLE "FeedingLog";
ALTER TABLE "new_FeedingLog" RENAME TO "FeedingLog";
CREATE INDEX "FeedingLog_pondId_recordedAt_idx" ON "FeedingLog"("pondId", "recordedAt");
CREATE TABLE "new_FishSpecies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameSci" TEXT,
    "optimalTempMin" REAL,
    "optimalTempMax" REAL,
    "targetFcrMin" REAL,
    "targetFcrMax" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FishSpecies" ("code", "createdAt", "id", "nameJa", "nameSci", "optimalTempMax", "optimalTempMin", "targetFcrMax", "targetFcrMin") SELECT "code", "createdAt", "id", "nameJa", "nameSci", "optimalTempMax", "optimalTempMin", "targetFcrMax", "targetFcrMin" FROM "FishSpecies";
DROP TABLE "FishSpecies";
ALTER TABLE "new_FishSpecies" RENAME TO "FishSpecies";
CREATE UNIQUE INDEX "FishSpecies_code_key" ON "FishSpecies"("code");
CREATE UNIQUE INDEX "FishSpecies_nameJa_key" ON "FishSpecies"("nameJa");
CREATE TABLE "new_Pond" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pond',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "volumeM3" REAL,
    "areaM2" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pond_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pond" ("areaM2", "code", "createdAt", "farmId", "id", "name", "type", "updatedAt", "volumeM3") SELECT "areaM2", "code", "createdAt", "farmId", "id", "name", "type", "updatedAt", "volumeM3" FROM "Pond";
DROP TABLE "Pond";
ALTER TABLE "new_Pond" RENAME TO "Pond";
CREATE UNIQUE INDEX "Pond_code_key" ON "Pond"("code");
CREATE TABLE "new_ProductionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "harvestedCount" INTEGER NOT NULL DEFAULT 0,
    "harvestedWeightKg" REAL NOT NULL DEFAULT 0,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "avgWeightG" REAL,
    "recordedUserId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionLog_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "FishSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionLog_recordedUserId_fkey" FOREIGN KEY ("recordedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductionLog" ("avgWeightG", "createdAt", "harvestedCount", "harvestedWeightKg", "id", "mortalityCount", "note", "pondId", "recordedAt", "recordedUserId", "speciesId") SELECT "avgWeightG", "createdAt", "harvestedCount", "harvestedWeightKg", "id", "mortalityCount", "note", "pondId", "recordedAt", "recordedUserId", "speciesId" FROM "ProductionLog";
DROP TABLE "ProductionLog";
ALTER TABLE "new_ProductionLog" RENAME TO "ProductionLog";
CREATE INDEX "ProductionLog_pondId_recordedAt_idx" ON "ProductionLog"("pondId", "recordedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
