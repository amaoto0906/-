-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pond" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pond',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "volumeM3" DOUBLE PRECISION,
    "areaM2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishSpecies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameSci" TEXT,
    "optimalTempMin" DOUBLE PRECISION,
    "optimalTempMax" DOUBLE PRECISION,
    "targetFcrMin" DOUBLE PRECISION,
    "targetFcrMax" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FishSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "proteinPct" DOUBLE PRECISION,
    "fatPct" DOUBLE PRECISION,
    "unitPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PondStock" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "stockedAt" TIMESTAMP(3) NOT NULL,
    "initialCount" INTEGER NOT NULL,
    "initialAvgWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PondStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingLog" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "amountKg" DOUBLE PRECISION NOT NULL,
    "mealsCount" INTEGER NOT NULL DEFAULT 1,
    "feederUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "harvestedCount" INTEGER NOT NULL DEFAULT 0,
    "harvestedWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "avgWeightG" DOUBLE PRECISION,
    "recordedUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterQualityLog" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "tempC" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "doMgL" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterQualityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAggregate" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalFeedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProductionKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMortalityCount" INTEGER NOT NULL DEFAULT 0,
    "fcr" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyAlert" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "targetDate" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'ma14-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiComment" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pondId" TEXT,
    "type" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pond_code_key" ON "Pond"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FishSpecies_code_key" ON "FishSpecies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FishSpecies_nameJa_key" ON "FishSpecies"("nameJa");

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

-- AddForeignKey
ALTER TABLE "Pond" ADD CONSTRAINT "Pond_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PondStock" ADD CONSTRAINT "PondStock_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PondStock" ADD CONSTRAINT "PondStock_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "FishSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingLog" ADD CONSTRAINT "FeedingLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingLog" ADD CONSTRAINT "FeedingLog_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingLog" ADD CONSTRAINT "FeedingLog_feederUserId_fkey" FOREIGN KEY ("feederUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "FishSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_recordedUserId_fkey" FOREIGN KEY ("recordedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterQualityLog" ADD CONSTRAINT "WaterQualityLog_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAggregate" ADD CONSTRAINT "DailyAggregate_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyAlert" ADD CONSTRAINT "AnomalyAlert_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastSnapshot" ADD CONSTRAINT "ForecastSnapshot_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "Pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "SensorDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
