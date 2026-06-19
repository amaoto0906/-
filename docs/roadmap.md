# 拡張ロードマップ

MVPは「日々の入力 → 集計 → 帳票 → 異常検知 → 簡易予測」を実用化済み。
以下は Phase 2 以降の拡張案です。MVPのDB/API設計に基づき、大規模改修なしに追加可能。

## Phase 2-A: IoTセンサー連携

| 項目 | 内容 |
|---|---|
| 対象センサー | 水温、pH、溶存酸素 (DO)、塩分濃度 |
| プロトコル | MQTT / HTTPS POST |
| データ受信 | `/api/sensors/[deviceId]/readings` (新規) |
| DB | 既存の `SensorDevice` / `SensorReading` テーブルを利用 |
| 表示 | 池詳細ページに時系列グラフ、ダッシュボードに最新値 |
| 異常検知 | センサー値ベースの新ルール追加 (水温×魚種許容範囲、DO低下) |

## Phase 2-B: 自動給餌機連携

| 項目 | 内容 |
|---|---|
| プロトコル | メーカーAPI (個別対応) |
| 機能 | 給餌スケジュール送信、給餌履歴の自動取り込み |
| DB追加 | `FeederDevice` `FeederCommand` `FeederLog` |
| 重複防止 | 自動給餌機ログと手動給餌の重複判定 |

## Phase 2-C: LLM AIコメント / アシスタント

| 項目 | 内容 |
|---|---|
| LLM | Claude API (Sonnet/Opus) または OpenAI |
| 適用先 | レポートコメント自動生成 (現状テンプレートを差し替え) |
| 新機能 | 自然文Q&A「今週、給餌量が多い池はどこですか？」 |
| 設計 | 既存の `CommentGenerator` インターフェースに `LLMCommentGenerator` を追加 |
| プロンプト | システムプロンプトに養殖業界の前提知識を埋め込み、RAGで実データを参照 |

## Phase 3-A: 高度な予測モデル

| 項目 | 内容 |
|---|---|
| モデル | Prophet (季節性に強い) / LightGBM (多変量) |
| 予測対象 | 給餌量、生産量、死亡率、FCR |
| 実装 | Python FastAPI ワーカーを別サービスで起動、Next.js から HTTP で呼ぶ |
| 学習データ | 過去6ヶ月以上の `daily_aggregates` + センサーデータ |

## Phase 3-B: モバイルアプリ

| 項目 | 内容 |
|---|---|
| フレームワーク | React Native + Expo |
| 共有 | API層を Next.js Server Actions から REST に切り出し |
| 機能 | 給餌入力、写真添付、QRコードで池選択 |
| オフライン | IndexedDB / SQLite ローカルキャッシュ |

## Phase 4: マルチテナント / SaaS化

| 項目 | 内容 |
|---|---|
| DB | テナント分離 (farm_id をすべての主要テーブルに付与済み) |
| 認証 | Auth.js の組織機能、SSO (Microsoft / Google) |
| プラン | Free / Pro / Enterprise |
| インフラ | Vercel + AWS RDS、Sentry、UptimeRobot |

---

## 既存設計の拡張余地

MVPで既に準備済みの拡張ポイント：

- **`User.role`** : viewer / worker / admin の3階層。さらに細かい権限が必要なら `permissions` テーブル追加
- **`Pond.status`** : active / paused / closed。Phase 2 で出荷タイムラインに使用
- **`WaterQualityLog.source`** : manual / sensor で記録源を区別済み
- **`FeedingLog.feederUserId`** : 担当者を記録済み、人時集計に拡張可能
- **`AnomalyAlert.severity`** : info / warning / critical で通知レベル分けの基盤
- **`AiComment.reportType + periodKey`** : LLM 出力もそのまま保存できるテーブル設計
