# 画面一覧

| カテゴリ | 画面名 | URL | 権限 |
|---|---|---|---|
| 公開 | ログイン | `/login` | 未ログイン可 |
| 公開 | アクセス拒否 | `/403` | 未ログイン可 |
| メイン | ダッシュボード | `/dashboard` | 全ロール |
| メイン | アラート一覧 | `/anomalies` | 全ロール |
| 日次入力 | 給餌入力 | `/feeding/new` | admin/worker |
| 日次入力 | 給餌編集 | `/feeding/[id]/edit` | admin/worker |
| 日次入力 | 生産入力 | `/production/new` | admin/worker |
| 日次入力 | 生産編集 | `/production/[id]/edit` | admin/worker |
| 日次入力 | 水質入力 | `/water-quality/new` | admin/worker |
| 履歴 | 給餌履歴 | `/feeding` | 全ロール |
| 履歴 | 生産履歴 | `/production` | 全ロール |
| 帳票 | 帳票一覧 (日/週/月) | `/reports?type=daily|weekly|monthly` | 全ロール |
| 帳票 | 日報プレビュー | `/reports/daily/[date]` | 全ロール |
| 帳票 | 週報プレビュー | `/reports/weekly/[week]` | 全ロール |
| 帳票 | 月報プレビュー | `/reports/monthly/[month]` | 全ロール |
| AI/分析 | 予測 | `/forecast` | 全ロール |
| マスタ | 池・水槽一覧 | `/masters/ponds` | 閲覧:全 / 編集:admin |
| マスタ | 池・水槽 新規 | `/masters/ponds/new` | admin |
| マスタ | 池・水槽 編集 | `/masters/ponds/[id]/edit` | admin |
| マスタ | 魚種一覧 | `/masters/fish-species` | 閲覧:全 / 編集:admin |
| マスタ | 魚種 新規/編集 | `/masters/fish-species/new`, `/[id]/edit` | admin |
| マスタ | 飼料一覧 | `/masters/feeds` | 閲覧:全 / 編集:admin |
| マスタ | 飼料 新規/編集 | `/masters/feeds/new`, `/[id]/edit` | admin |
| 設定 | アカウント設定 | `/settings` | 全ロール |
| 設定 | パスワード変更 | `/settings/password` | 全ロール |

# API一覧

| メソッド | パス | 用途 |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | Auth.js 認証エンドポイント |
| GET | `/api/reports/daily/pdf?date=YYYY-MM-DD` | 日報PDFダウンロード |
| GET | `/api/reports/weekly/pdf?week=YYYY-Www` | 週報PDFダウンロード |
| GET | `/api/reports/monthly/pdf?month=YYYY-MM` | 月報PDFダウンロード |

データ操作は Server Actions（`*/actions.ts`）で実装されており、各 Server Action はセッション確認と
ロールベース権限チェックを行います。
