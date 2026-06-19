# 納品チェックリスト 検査結果

**検査日**: 2026-06-20
**検査対象**: 養魚場管理自動化システム MVP（チェックリスト整合性アップグレード + バグ修正後）

凡例: ✅ 実装済 / ⚠️ 部分対応 / ❌ 未対応

## 🐛 2026-06-20 詳細監査で発見・修正したバグ

監査エージェントによるコードレビューと Playwright E2E テスト（20 シナリオ）で
以下のバグを発見し、すべて修正しました。

| # | 重要度 | 対象 | 内容 | 修正 |
|---|---|---|---|---|
| 1 | 🔴 CRITICAL | `feeding/production/water-quality/anomalies` Server Actions | `requireSession` を使っていたため、`viewer` ロールでも記録の作成・編集・削除ができた | `requireWorkerOrAdmin` に変更 |
| 2 | 🟡 MAJOR | `feeding/production/water-quality` actions | `new Date("YYYY-MM-DD")` が UTC 解釈になり、サーバー TZ が JST 以外だと日付がズレて集計バケットが間違う | `parseLocalDate()` ヘルパーを追加し全箇所で使用 |
| 3 | 🟡 MAJOR | マスタフォーム (`pond/species/feed`) | `isActive` チェックボックスを外しても `!f.has("isActive")` が真になり、無効化できなかった | hidden `value="false"` + checkbox `value="true"` のパターンに変更 |
| 4 | 🟡 MAJOR | `dashboard/page.tsx` | リクエストごとに `recalcAll(35)` と `runAnomalyDetection()` を実行し、複数ユーザー同時アクセス時に重複アラート発生 | `debouncedRefresh()` で 30 秒に 1 回までに制限 |
| 5 | 🟡 MINOR | `aggregation.getDashboardSummary` | 当期と前期の境界日 (`from30`) が両方の集計に入り、前月比率が誤算 | 前期側を `lt` に変更して重複を排除 |
| 6 | 🟡 MAJOR | `anomaly.detectFeedSpike/MortalitySpike` | 最新ログが今日のものでなくても「最新」として判定し、古いデータで偽陽性を出していた | 最新ログが3日以上前ならスキップ |
| 7 | 🟡 MAJOR | `anomaly.detectFcrAnomaly` | UTC ベースの date キー (`toISOString().split("T")[0]`) を使っており、`DailyAggregate.date`（local）とズレる | `toDateKey()` に統一 |
| 8 | 🔴 CRITICAL | `middleware.ts` | Auth.js v5 beta + middleware で Server Action の POST 時に `req.auth` が null と判定され、createPond/createFeeding 等が常にログイン画面にリダイレクトされていた | middleware を cookie ベースの軽量判定に変更し、POST は素通り。実際の認証は各 Server Action 内の `requireSession/requireAdmin` で行う |
| 9 | 🟡 MAJOR | `ConfirmDeleteForm` | 確認ボタンの `onClick` で `setOpen(false)` を即座に呼び、`<form>` が unmount されて Server Action が発火しなかった | `useTransition` で submission の完了を待ってからダイアログを閉じる |

### E2E 検証結果

Playwright で 20 シナリオを通しテスト：

```
✅ Login as admin
✅ Create new pond                          # Server Action POST 動作
✅ Edit the new pond                         # 編集 → 保存 → 一覧反映
✅ Toggle isActive (deactivate)              # isActive チェックボックス修正
✅ Toggle isActive (reactivate)
✅ Create feeding record                     # mealsCount 含む
✅ Edit feeding record                       # 値の更新を確認
✅ Delete feeding record with confirm dialog # useTransition でレース解消
✅ Password change rejects wrong current password
✅ Anomaly detection picks up planted data
✅ Acknowledge first anomaly alert           # workerOrAdmin 通過
✅ 404 page for unknown URL
✅ Dashboard tabs (today/week/month)
✅ Forecast loads
✅ Daily PDF download
✅ Weekly PDF download
✅ Monthly PDF download
✅ Worker login + masters viewable (read-only)
✅ Worker CAN create feeding (writer permission)
✅ Cleanup: delete test pond

=== 20 passed, 0 failed ===
```

---

---

## 1. ログイン・権限管理

| チェック項目 | 状態 |
|---|---|
| 管理者がログインできる | ✅ |
| 一般ユーザーがログインできる | ✅ |
| ログアウトできる | ✅ |
| パスワード変更ができる | ✅ |
| 管理者と一般ユーザーで表示・操作範囲を分けられる | ✅ |
| 未ログイン状態で管理画面にアクセスできない | ✅ |
| 不正なURLアクセス時に適切に制御される | ✅ (404 / 403) |

---

## 2. マスタ管理

### 魚種

| チェック項目 | 状態 |
|---|---|
| 新規登録 | ✅ |
| 編集 | ✅ |
| 削除または無効化 | ✅ (両方) |
| 一覧表示 | ✅ |
| 重複登録防止 | ✅ (nameJa UNIQUE) |

### 池・水槽

| チェック項目 | 状態 |
|---|---|
| 登録 | ✅ |
| 名称・場所・容量管理 | ✅ |
| ステータス管理 (使用中/停止中/廃止) | ✅ |
| 魚種・生産との紐付け | ✅ |

### 飼料

| チェック項目 | 状態 |
|---|---|
| 登録 | ✅ |
| 単位・メーカー・備考 | ✅ |
| 給餌入力で選択 | ✅ |
| 無効化 | ✅ |

---

## 3. 生産データ入力

| チェック項目 | 状態 |
|---|---|
| 日付指定で登録 | ✅ |
| 魚種選択 | ✅ |
| 池・水槽選択 | ✅ |
| 生産数・重量・死亡数入力 | ✅ |
| 備考入力 | ✅ |
| 編集 | ✅ |
| 削除/無効化 | ✅ |
| 必須項目バリデーション | ✅ (Zod) |
| 数値項目に不正値防止 | ✅ |
| 重複登録ルール | ⚠️ 同日複数記録は明示的に許可（要件次第） |

---

## 4. 給餌データ入力

| チェック項目 | 状態 |
|---|---|
| 日付指定 | ✅ |
| 魚種・池・飼料選択 | ✅ |
| 給餌量 | ✅ |
| 給餌回数 | ✅ |
| 担当者記録 | ✅ (`feederUserId`) |
| 備考 | ✅ |
| 編集 | ✅ |
| 削除 | ✅ |
| 単位明確化 | ✅ (kg / L / 袋) |
| 異常値防止 | ✅ (0以下/上限10000kg/負数禁止) |

---

## 5. 検索・一覧表示

| チェック項目 | 状態 |
|---|---|
| 生産データ一覧 | ✅ |
| 給餌データ一覧 | ✅ |
| 日付範囲検索 | ✅ |
| 魚種別 | ✅ |
| 池・水槽別 | ✅ |
| 飼料別 | ✅ |
| キーワード検索 | ✅ |
| 件数表示 | ✅ |
| ページネーション | ✅ |
| PC・タブレット表示 | ✅ |

---

## 6. 自動集計機能

| チェック項目 | 状態 |
|---|---|
| 日別生産量 | ✅ |
| 週別生産量 | ✅ (`getWeeklyTotals`) |
| 月別生産量 | ✅ (`getMonthlyTotals`) |
| 魚種別生産量 | ✅ (`getBySpecies`) |
| 池別生産量 | ✅ (`getByPondDetail`) |
| 日別給餌量 | ✅ |
| 週別給餌量 | ✅ |
| 月別給餌量 | ✅ |
| 魚種別・池別飼料使用量 | ✅ |
| 集計値と元データの整合性 | ✅ (記録保存時に再計算) |

---

## 7. ダッシュボード

| チェック項目 | 状態 |
|---|---|
| ログイン後にダッシュボード表示 | ✅ |
| 本日の概要 | ✅ (本日タブ) |
| 今週・今月集計 | ✅ (期間タブ) |
| 魚種別状況 | ✅ |
| 池・水槽別状況 | ✅ |
| 異常値表示 | ✅ |
| グラフで視覚確認 | ✅ (Recharts) |
| 表示速度 | ✅ (Server Components) |

---

## 8. 日報・週報・月報

| チェック項目 | 状態 |
|---|---|
| 日報自動生成 | ✅ |
| 週報自動生成 | ✅ |
| 月報自動生成 | ✅ |
| 対象期間指定 | ✅ |
| 生産量反映 | ✅ |
| 給餌量反映 | ✅ |
| 魚種別・池別集計反映 | ✅ |
| 備考・現場メモ反映 | ✅ |
| 異常値コメント表示 | ✅ |
| 画面上で確認 | ✅ |

---

## 9. PDF出力

| チェック項目 | 状態 |
|---|---|
| 日報PDF | ✅ |
| 週報PDF | ✅ |
| 月報PDF | ✅ |
| レイアウト | ✅ |
| 日本語化け | ✅ (Noto Sans JP) |
| 表・数値・日付 | ✅ |
| ファイル名 | ✅ (`daily-report-2026-06-20.pdf` 等) |
| PC・タブレットから出力 | ✅ |
| 印刷レイアウト | ✅ (A4) |

---

## 10. AI・分析

### 異常値検知

| チェック項目 | 状態 |
|---|---|
| 給餌量急増・急減 | ✅ |
| 生産量急減 | ✅ |
| 死亡数急増 | ✅ |
| 基準設定 (前週比・前月比) | ✅ |
| ダッシュボード表示 | ✅ |
| レポートコメント反映 | ✅ |
| 確認済み扱い | ✅ |

### 簡易予測

| チェック項目 | 状態 |
|---|---|
| 生産量・給餌量予測 | ✅ |
| 飼料使用量見込み | ✅ |
| 対象期間指定 | ✅ (7/14/30日) |
| データ不足メッセージ | ✅ |
| 断定的でない表現 | ✅ (参考値として明示) |

### AIコメント生成

| チェック項目 | 状態 |
|---|---|
| 日報・週報・月報に自動コメント | ✅ |
| 前週比・前月比・増減傾向 | ✅ |
| 異常値時の注意 | ✅ |
| 自然な日本語 | ✅ (テンプレート方式) |
| 実データと矛盾しない | ✅ |

---

## 11. PC・タブレット対応

| チェック項目 | 状態 |
|---|---|
| PC操作 | ✅ |
| タブレット操作 | ✅ |
| タブレット用フォーム | ✅ (数値入力大型化) |
| ボタンサイズ | ✅ |
| 横スクロール対応 | ✅ |
| PDF操作ボタン | ✅ |
| Chrome/Safari/Edge | ✅ |

---

## 12. データ整合性

| チェック項目 | 状態 |
|---|---|
| 削除済みマスタの影響なし | ✅ (関連レコード同時削除) |
| 紐付け保存 | ✅ |
| 集計対象外 | ✅ (無効化フラグ) |
| 日付の扱い | ✅ |
| タイムゾーン (Asia/Tokyo) | ✅ |
| 小数点・単位の統一 | ✅ |
| バックアップ設計 | ✅ (SQLiteファイルコピー / PostgreSQL移行可) |

---

## 13. エラー処理・バリデーション

| チェック項目 | 状態 |
|---|---|
| 必須項目未入力エラー | ✅ |
| 数値不正値エラー | ✅ |
| サーバーエラー時白画面回避 | ✅ (error.tsx) |
| API失敗時のメッセージ | ✅ |
| PDF生成失敗 | ✅ (try/catch) |
| 完了メッセージ | ✅ (パスワード変更ほか) |
| 誤削除防止ダイアログ | ✅ |

---

## 14. セキュリティ

| チェック項目 | 状態 |
|---|---|
| パスワード暗号化 (bcrypt) | ✅ |
| SQLインジェクション対策 (Prisma) | ✅ |
| XSS対策 (React) | ✅ |
| CSRF対策 (Auth.js / Server Actions) | ✅ |
| 権限制御 | ✅ |
| API認証・権限 | ✅ |
| デバッグ情報非表示 | ✅ (本番モード) |
| 環境変数の保護 | ✅ (.env / .gitignore) |

---

## 15. 将来拡張性

| チェック項目 | 状態 |
|---|---|
| IoT連携DB設計 | ✅ (準備済) |
| 自動給餌機API余地 | ✅ (設計余地あり) |
| 水質データ追加 | ✅ |
| LINE/メール通知 | ⏳ Phase 2 |
| 複数養魚場対応 | ✅ (farms テーブル) |
| CSV/Excelインポート | ⏳ Phase 2 |
| 外部システム連携API | ✅ (REST 化容易) |

---

## 16. 納品前テスト

| チェック項目 | 状態 |
|---|---|
| テスト用データで操作確認 | ✅ |
| サンプルデータで確認 | ✅ |
| CRUD + 検索 + 集計 | ✅ |
| PDF出力確認 | ✅ |
| ダッシュボード数値と元データ一致 | ✅ |
| 権限別操作確認 | ✅ |
| PC・タブレット確認 | ✅ |
| 主要ブラウザ確認 | ✅ |
| エラーケース確認 | ✅ |

---

## 17. 納品物

| チェック項目 | 状態 |
|---|---|
| 検証環境にデプロイ | ✅ (localhost で動作中) |
| 管理者アカウント発行 | ✅ (admin@example.com / password) |
| 操作マニュアル | ✅ (`docs/operations-manual.md`) |
| 画面一覧 | ✅ (`docs/screen-list.md`) |
| 機能一覧 | ✅ (`docs/feature-list.md`) |
| DB構成説明 | ✅ (`docs/db-schema.md`) |
| 拡張案 | ✅ (`docs/roadmap.md`) |
| 保守・運用範囲 | ✅ (本ファイル末尾参照) |

---

## 総合判定

**MVP納品可能水準** ✅

- 必須機能（チェックリストの「必須」タグ）: 100% 実装済
- 推奨機能（簡易予測・AIコメント・IoT想定設計）: 100% 実装済
- 残課題: LINE/メール通知、CSV/Excelインポートのみ。これらは Phase 2 として別契約化

## 保守・運用範囲（提案）

- 軽微なバグ修正・運用問い合わせ: 1ヶ月無償保証
- 機能追加: 別途見積
- IoT連携・LLM拡張・モバイルアプリ: Phase 2 契約として詳細見積

担当: christiangaston14@gmail.com
