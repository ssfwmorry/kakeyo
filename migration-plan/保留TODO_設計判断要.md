# かけよ Next.js 移行：保留 TODO（設計判断が要る積み残し）

- **作成日**: 2026-09-22
- **位置づけ**: [機能差分リスト.md](機能差分リスト.md) のうち、**実装前に設計判断・仕様確定が必要**なため別セッションへ送る項目をまとめる。
  自明な欠落（A-1 / A-2 / A-5 等）は本移行セッションで対応済み。ここに残すのは「方針が決まらないと着手できない」もの。
- **前提文書**: [移行方針確定書.md](移行方針確定書.md) §5（認証・UID 付け替え） / [移行手順書.md](移行手順書.md)（凍結資産・鉄則）
- **凡例**: 🔴=機能欠落（要対応だが設計待ち） / 🔵=要確認

---

## T-1. 🔴 アカウント削除（退会 / deleteUser）— 差分リスト A-3

### 現状

- **Next版**: 設定「その他」タブは**ログアウトのみ**（[general-tab.tsx](../nextjs/src/app/(private)/setting/general-tab.tsx) に「本移行では省略・TODO(別チケット)」と明記）。退会導線なし。
- **旧Vue版**: `components/setting/General.vue`。2段階の同意チェックボックス
  （「消しても後悔しません」→「開発者にデータの復元を求めません」）を経て、
  `useFirebase.signOut()` → `useFirebase.deleteUser()`（**Firebase Auth のユーザ削除のみ**）→ login へ遷移。
  ※ 旧実装は Firebase Auth 上のユーザを消すだけで、**records / pairs 等の業務データの削除・匿名化には触れていない**。

### 設計判断が必要な論点（着手前に決めること）

1. **auth.users の削除方法**
   - Supabase Auth のユーザ削除は管理者権限（service_role）の `auth.admin.deleteUser(uid)` が必要。
     クライアント/通常セッションからは実行不可 → **Server Action + service_role キー**（サーバ限定・環境変数）で行う設計になる。
   - service_role キーの取り扱い（`lib/server/env.server.ts` 相当に隔離。クライアントへ絶対に出さない）。
2. **関連データの扱い（最重要・法的にも関わる）**
   - ペア（夫婦）家計簿という性質上、退会ユーザの records / planned_records / bank / pairs を
     **物理削除するか / 匿名化するか / ペア相手のデータ整合をどう保つか**を決める必要がある。
     - 例: ペア相手が残る場合、共有 record（record_type=10/5/15）や pairs 行を消すと相手の家計が壊れる。
   - FK 制約（records.user_id → auth.users 等）の on delete 挙動（CASCADE / SET NULL / RESTRICT）を
     DDL で確認・確定する（[docs/database/tables.md](../docs/database/tables.md)）。
   - 旧実装が業務データを消していない＝**現行踏襲なら Auth ユーザ削除のみ**だが、
     それだと「退会したのにデータが残る」状態になる。移行を機に方針を決めるべき。
3. **UX（同意フロー）**
   - 旧の 2 段階同意チェックを踏襲するか、shadcn の AlertDialog による確認に置き換えるか。
   - ドロワー廃止（差分リスト B-1）に伴い、退会導線は設定「その他」タブ内で完結させる想定。

### 対応方針メモ（決定後の実装イメージ）

- `setting/general-tab.tsx` に退会セクション（2 段階同意 or AlertDialog）を追加。
- `deleteUserAction`（Server Action・service_role 使用）で
  「関連データ処理（方針次第）→ `auth.admin.deleteUser` → signOut → /login redirect + flash」。
- **public スキーマへの書き込み（削除）を伴うため、実行前にオーケストレータ承認が必要**
  （[AGENTS.md](../nextjs/AGENTS.md) 「public スキーマの DB 書き込みは許可制」）。

---

## T-2. 🔵 メール確認（本人確認）フロー — 差分リスト C-10

### 現状

- **旧Vue版（`useFirebase`）**: サインアップ時に `sendEmailVerification`、
  ログイン時に `emailVerified === false` を弾いて「本人確認メールの URL で認証を」表示、`IsInWhiteList` で例外扱い。
- **Next版**: これらが**一切存在しない**（`grep` で 0 件）。
  新規登録 UI 自体が旧でも無効化されているため運用上の影響は限定的。

### 設計判断が必要な論点

1. **ログイン時の未認証弾き**が Supabase Auth 側の設定（Confirm email 有効化）で代替されているかを確認する。
   - Supabase の Auth 設定で "Confirm email" が ON なら、未確認ユーザはそもそもセッションを持てず、
     アプリ側での明示的な弾きは不要になる可能性が高い（=実装不要で確定できるかもしれない）。
2. 新規登録フローを Next 版で復活させるかどうか（旧は無効化済み）。復活させる場合のみ
   `sendEmailVerification` 相当（Supabase の signUp + email confirm）が要る。

### 対応方針メモ

- まず **Supabase プロジェクトの Auth 設定（Confirm email / ホワイトリスト運用）を確認**し、
  「アプリ側実装が要るのか、設定で足りるのか」を切り分ける。多くの場合は Supabase 設定側で完結する見込み。
- 設定で代替できていれば **本項目は「対応不要（設定で担保）」としてクローズ**できる。

---

## 着手前チェックリスト（別セッション用）

- [ ] T-1: FK on delete 挙動を DDL で確認（records / pairs / planned_records の user_id 参照）
- [ ] T-1: 退会時の関連データ方針（物理削除 / 匿名化 / ペア整合）をプロダクト判断で確定
- [ ] T-1: service_role キーのサーバ限定管理の設計
- [ ] T-1: public スキーマ書き込みのオーケストレータ承認
- [ ] T-2: Supabase Auth の "Confirm email" 設定状況を確認し、実装要否を切り分け
