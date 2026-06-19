-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pond" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pond',
    "volumeM3" REAL,
    "areaM2" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pond_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FishSpecies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameSci" TEXT,
    "optimalTempMin" REAL,
    "optimalTempMax" REAL,
    "targetFcrMin" REAL,
    "targetFcrMax" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "proteinPct" REAL,
    "fatPct" REAL,
    "unitPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PondStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "stockedAt" DATETIME NOT NULL,
    "initialCount" INTEGER NOT NULL,
    "initialAvgWeight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PondStock_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PondStock_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "FishSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "amountKg" REAL NOT NULL,
    "feederUserId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedingLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeedingLog_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeedingLog_feederUserId_fkey" FOREIGN KEY ("feederUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionLog" (
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
    CONSTRAINT "ProductionLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionLog_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "FishSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionLog_recordedUserId_fkey" FOREIGN KEY ("recordedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterQualityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "tempC" REAL,
    "ph" REAL,
    "doMgL" REAL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterQualityLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalFeedKg" REAL NOT NULL DEFAULT 0,
    "totalProductionKg" REAL NOT NULL DEFAULT 0,
    "totalMortalityCount" INTEGER NOT NULL DEFAULT 0,
    "fcr" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyAggregate_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnomalyAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "acknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnomalyAlert_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pondId" TEXT NOT NULL,
    "targetDate" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "predictedValue" REAL NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'ma14-v1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForecastSnapshot_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SensorDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "pondId" TEXT,
    "type" TEXT NOT NULL,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "SensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "SensorDevice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pond_code_key" ON "Pond"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FishSpecies_code_key" ON "FishSpecies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Feed_code_key" ON "Feed"("code");

-- CreateIndex
CREATE INDEX "FeedingLog_pondId_recordedAt_idx" ON "FeedingLog"("pondId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProductionLog_pondId_recordedAt_idx" ON "ProductionLog"("pondId", "recordedAt");

-- CreateIndex
CREATE INDEX "WaterQualityLog_pondId_recordedAt_idx" ON "WaterQualityLog"("pondId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAggregate_pondId_date_key" ON "DailyAggregate"("pondId", "date");

-- CreateIndex
CREATE INDEX "AnomalyAlert_pondId_detectedAt_idx" ON "AnomalyAlert"("pondId", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastSnapshot_pondId_targetDate_metric_key" ON "ForecastSnapshot"("pondId", "targetDate", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "AiComment_reportType_periodKey_key" ON "AiComment"("reportType", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "SensorDevice_deviceId_key" ON "SensorDevice"("deviceId");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_recordedAt_idx" ON "SensorReading"("deviceId", "recordedAt");
