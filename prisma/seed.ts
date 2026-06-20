import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// シードは PgBouncer 経由だと prepared statement エラーが出やすいので、
// DIRECT_URL (Supabase の直接接続 port 5432) を優先して使う。
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱 Seeding...");

  // クリア
  await prisma.aiComment.deleteMany();
  await prisma.forecastSnapshot.deleteMany();
  await prisma.anomalyAlert.deleteMany();
  await prisma.dailyAggregate.deleteMany();
  await prisma.waterQualityLog.deleteMany();
  await prisma.productionLog.deleteMany();
  await prisma.feedingLog.deleteMany();
  await prisma.pondStock.deleteMany();
  await prisma.feed.deleteMany();
  await prisma.fishSpecies.deleteMany();
  await prisma.pond.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.user.deleteMany();

  // ユーザー
  const hashed = await bcrypt.hash("password", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "管理者",
      password: hashed,
      role: "admin",
    },
  });
  await prisma.user.create({
    data: {
      email: "worker@example.com",
      name: "作業員",
      password: hashed,
      role: "worker",
    },
  });

  // 養魚場
  const farm = await prisma.farm.create({
    data: { name: "サンプル養魚場", location: "千葉県館山市" },
  });

  // 池
  const ponds = await Promise.all([
    prisma.pond.create({
      data: {
        farmId: farm.id,
        code: "P-001",
        name: "第1池",
        type: "pond",
        volumeM3: 500,
        areaM2: 200,
      },
    }),
    prisma.pond.create({
      data: {
        farmId: farm.id,
        code: "P-002",
        name: "第2池",
        type: "pond",
        volumeM3: 600,
        areaM2: 240,
      },
    }),
    prisma.pond.create({
      data: {
        farmId: farm.id,
        code: "T-001",
        name: "陸上水槽1",
        type: "tank",
        volumeM3: 50,
        areaM2: 20,
      },
    }),
  ]);

  // 魚種
  const species = await Promise.all([
    prisma.fishSpecies.create({
      data: {
        code: "MADAI",
        nameJa: "マダイ",
        nameSci: "Pagrus major",
        optimalTempMin: 18,
        optimalTempMax: 26,
        targetFcrMin: 1.0,
        targetFcrMax: 2.0,
      },
    }),
    prisma.fishSpecies.create({
      data: {
        code: "BURI",
        nameJa: "ブリ",
        nameSci: "Seriola quinqueradiata",
        optimalTempMin: 18,
        optimalTempMax: 28,
        targetFcrMin: 1.2,
        targetFcrMax: 2.5,
      },
    }),
  ]);

  // 飼料
  const feeds = await Promise.all([
    prisma.feed.create({
      data: {
        code: "F-EP3",
        name: "EP3号",
        manufacturer: "○○飼料",
        unit: "kg",
        proteinPct: 50,
        fatPct: 12,
        unitPrice: 250,
      },
    }),
    prisma.feed.create({
      data: {
        code: "F-EP5",
        name: "EP5号",
        manufacturer: "○○飼料",
        unit: "kg",
        proteinPct: 48,
        fatPct: 14,
        unitPrice: 240,
      },
    }),
  ]);

  // 放流ロット
  await prisma.pondStock.create({
    data: {
      pondId: ponds[0].id,
      speciesId: species[0].id,
      stockedAt: daysAgo(90),
      initialCount: 5000,
      initialAvgWeight: 50,
    },
  });
  await prisma.pondStock.create({
    data: {
      pondId: ponds[1].id,
      speciesId: species[1].id,
      stockedAt: daysAgo(60),
      initialCount: 3000,
      initialAvgWeight: 100,
    },
  });
  await prisma.pondStock.create({
    data: {
      pondId: ponds[2].id,
      speciesId: species[0].id,
      stockedAt: daysAgo(30),
      initialCount: 1000,
      initialAvgWeight: 20,
    },
  });

  // 過去30日の給餌・生産・水質
  for (let i = 30; i >= 1; i--) {
    const day = daysAgo(i);
    for (let p = 0; p < ponds.length; p++) {
      const pond = ponds[p];
      const baseFeed = [30, 40, 5][p]; // 池ごとのベース給餌量(kg)
      // 1週間ごとの僅かな増減 + ランダム
      const trend = 1 + (30 - i) * 0.005;
      let amount = baseFeed * trend * (0.9 + Math.random() * 0.2);
      // 5日前に異常スパイクを意図的に入れる
      if (i === 5 && p === 0) amount = baseFeed * 2.5;

      await prisma.feedingLog.create({
        data: {
          pondId: pond.id,
          feedId: feeds[p % feeds.length].id,
          recordedAt: day,
          amountKg: Math.round(amount * 10) / 10,
          mealsCount: 2,
          feederUserId: admin.id,
        },
      });

      // 生産: 月に数回の出荷想定 → ランダム少量出荷 + 死亡数
      const harvested = i % 10 === 0 ? Math.floor(50 + Math.random() * 100) : 0;
      const harvestedKg = harvested * (0.4 + Math.random() * 0.2);
      let mortality = Math.floor(Math.random() * 3);
      if (i === 3 && p === 1) mortality = 25; // 異常スパイク

      const sp = p === 1 ? species[1] : species[0];
      await prisma.productionLog.create({
        data: {
          pondId: pond.id,
          speciesId: sp.id,
          recordedAt: day,
          harvestedCount: harvested,
          harvestedWeightKg: Math.round(harvestedKg * 10) / 10,
          mortalityCount: mortality,
          avgWeightG: 400 + Math.random() * 100,
          recordedUserId: admin.id,
        },
      });

      // 水質: 1日1回 (Math.cosで季節風 + ランダム)
      await prisma.waterQualityLog.create({
        data: {
          pondId: pond.id,
          recordedAt: day,
          tempC: 22 + Math.sin(i / 5) * 2 + Math.random(),
          ph: 7.5 + (Math.random() - 0.5) * 0.4,
          doMgL: 7 + (Math.random() - 0.5) * 1.5,
        },
      });
    }
  }

  console.log("✅ Seeded:");
  console.log("  Users: admin@example.com / worker@example.com (password: password)");
  console.log(`  Ponds: ${ponds.length}, Species: ${species.length}, Feeds: ${feeds.length}`);
  console.log("  30 days of feeding/production/water quality logs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
