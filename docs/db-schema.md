# DB構成（PostgreSQL移行を見据えた SQLite + Prisma スキーマ）

## マスタ系

### users
ユーザーマスタ。Auth.js Credentials の検証元。

| カラム | 型 | 説明 |
|---|---|---|
| id | String | PK (cuid) |
| email | String UNIQUE | ログインID |
| name | String | 表示名 |
| password | String | bcryptハッシュ |
| role | String | admin / worker / viewer |
| passwordChangedAt | DateTime? | パスワード最終変更日時 |
| createdAt / updatedAt | DateTime | |

### farms
養魚場マスタ。複数拠点対応の余地。

### ponds
池・水槽マスタ。

| カラム | 説明 |
|---|---|
| code | UNIQUE（P-001 等） |
| name | 名称 |
| type | pond / tank |
| status | active / paused / closed |
| isActive | 入力フォームに表示するか |
| volumeM3 / areaM2 | 容量・面積 |

### fish_species
魚種マスタ。

| カラム | 説明 |
|---|---|
| code | UNIQUE |
| nameJa | UNIQUE（重複防止） |
| nameSci | 学名 |
| optimalTempMin/Max | 最適水温レンジ |
| targetFcrMin/Max | 基準FCR（異常検知に使用） |
| isActive | 有効フラグ |

### feeds
飼料マスタ。

| カラム | 説明 |
|---|---|
| code | UNIQUE |
| name / manufacturer | 名称・メーカー |
| unit | kg / L / 袋 |
| proteinPct / fatPct | 蛋白・脂質% |
| unitPrice | 単価 |
| isActive | 有効フラグ |

### pond_stocks
池への放流ロット。pond_id × species_id で過去ロットを記録。

## トランザクション系

### feeding_logs
給餌記録。

| カラム | 説明 |
|---|---|
| pond_id / feed_id | 外部キー |
| recorded_at | 給餌日時 |
| amountKg | 給餌量 |
| mealsCount | 給餌回数 |
| feederUserId | 担当ユーザー |
| note | 備考 |
| @@index([pondId, recordedAt]) | 検索用 |

### production_logs
生産（出荷・死亡）記録。

| カラム | 説明 |
|---|---|
| pond_id / species_id | 外部キー |
| recorded_at | 記録日時 |
| harvestedCount / harvestedWeightKg | 出荷尾数・重量 |
| mortalityCount | 死亡数 |
| avgWeightG | 平均体重 |
| recordedUserId | 記録者 |
| note | 備考 |

### water_quality_logs
水質記録。

| カラム | 説明 |
|---|---|
| pond_id | 外部キー |
| recorded_at | 測定日時 |
| tempC / ph / doMgL | 水温・pH・溶存酸素 |
| source | manual / sensor (将来用) |

### daily_aggregates
日次集計キャッシュ。`(pondId, date)` で UNIQUE。
日次入力の保存時に再計算。

| カラム | 説明 |
|---|---|
| date | YYYY-MM-DD |
| totalFeedKg / totalProductionKg / totalMortalityCount | 集計値 |
| fcr | 飼料係数 (feed / production) |

## AI / 分析系

### anomaly_alerts
異常検知アラート。検知時に作成、ユーザー確認で `acknowledgedAt` を設定。

| カラム | 説明 |
|---|---|
| type | feed_spike / mortality_spike / fcr_anomaly / missing_input / production_drop |
| severity | info / warning / critical |
| message | 表示メッセージ |

### forecast_snapshots
予測結果スナップショット。`(pondId, targetDate, metric)` で UNIQUE。

### ai_comments
AIコメントキャッシュ。`(reportType, periodKey)` で UNIQUE。
レポート画面を開いた際に自動生成・更新。

## 将来拡張用（スキーマだけ用意）

### sensor_devices / sensor_readings
IoTセンサーデバイスと時系列データ。MQTTやHTTPで取り込み可能。

---

## ER 簡易図

```
Farm ─< Pond ─< PondStock >─ FishSpecies
              ├── FeedingLog >─ Feed
              ├── ProductionLog >─ FishSpecies
              ├── WaterQualityLog
              ├── DailyAggregate
              ├── AnomalyAlert
              ├── ForecastSnapshot
              └── SensorDevice ─< SensorReading
User ──< FeedingLog
User ──< ProductionLog
```

---

## マイグレーション履歴

| 日付 | 名前 | 内容 |
|---|---|---|
| 2026-06-19 | init | 初期スキーマ |
| 2026-06-20 | add_isactive_and_units | isActive / unit / mealsCount / nameJa UNIQUE / passwordChangedAt 追加 |
