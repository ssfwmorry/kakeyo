# かけよ Next.js 移行：デモモード設計変更（DB 非依存化 + ペア有無の選択）

- **作成日**: 2026-09-22
- **位置づけ**: デモモードの扱いに関する**設計判断の確定メモ**。本セッションは設計のみで実装しない。
  実装は別セッションで本書を正として着手する（`保留TODO_設計判断要.md` と同じ立て付け）。
- **前提文書**: [移行方針確定書.md](移行方針確定書.md) §8（デモ / ペアモード） / [移行手順書.md](移行手順書.md) §4.2（認証・凍結資産）
- **凡例**: 🟢=確定 / 🔵=実装時に詰める細部

---

## 0. 背景と動機

デモアカウントは**不特定多数からアクセスされる**運用を想定する。そのため、デモの全ライフサイクル
（ログイン → 各画面表示 → 操作）で **Supabase Auth・DB に一切アクセスさせない**ことをゴールとする。

### 現状（変更前）に残っている DB / バックエンドアクセス経路

現状はアプリのデータ層こそ安全（取得=モック / 更新=no-op）だが、**認証層が DB / Supabase Auth を叩いている**。

| 経路 | 現状の実装 | 不特定多数アクセス時の懸念 |
| :--- | :--- | :--- |
| デモログインの認証 | [demoLoginAction](../nextjs/src/features/auth/actions/login-actions.ts) が実 Supabase `signInWithPassword` を叩く | Supabase Auth への**認証リクエストが青天井**（レート制限・課金・アカウントロック）。実在アカウント + パスワードの運用コスト |
| セッション導出（毎リクエスト） | [session.ts](../nextjs/src/features/auth/server/session.ts) の `getSessionData` が `getUser()`（Auth 往復）+ `findUserBySupabaseUid`（**DB**）+ `getPairId`（**DB**） | デモの**全リクエストで DB に 2 クエリ**。ここが最大の穴 |
| アプリのデータ取得 | サービス層が [withDemoRead](../nextjs/src/features/auth/server/demo.ts) でモック返却 | DB に触れない（OK・変更不要） |
| アプリのデータ更新 | [withDemoWriteVoid](../nextjs/src/features/auth/server/demo.ts) で no-op 成功 | DB に触れない（OK・変更不要） |

→ **アプリ層は既に安全。塞ぐべきは認証層。**

---

## 1. 確定方針（🟢）

### 1-A. デモを「Supabase を経由しない純粋なフロントエンドセッション」にする

```
【変更後】
 デモログイン ──> 署名付きデモ Cookie をセットするだけ（Supabase を一切叩かない）
 各リクエスト ──> getSessionData 先頭でデモ Cookie を検証 → DB 照会せず固定 SessionData を返す
 データ取得/更新 ──> withDemoRead / withDemoWriteVoid（そのまま流用・約 600 行のモック資産は無傷）
```

- デモログイン = **署名付きデモ Cookie をセットするだけ**。Supabase `signInWithPassword` は呼ばない。
- `getSessionData()` は**先頭でデモ Cookie を検証**し、有効なら **DB 照会を一切せず固定 `SessionData`** を早期 return する。
- 既存の `withDemoRead` / `withDemoWriteVoid` と各 feature の `demo.ts`（モックデータ・約 600 行）は
  **一切変更しない**。`isDemo=true` が立てば従来どおりモック注入・no-op が効く。

### 1-B. 書き込み UX は現状維持（no-op 成功）（🟢）

- 登録・編集・削除は従来どおり `withDemoWriteVoid` で **no-op（成功トーストは出るが反映されない）**。
  DB アクセスなし。実装ゼロで最も安全。今回この挙動は変えない。

### 1-C. デモは「ペアあり / ペアなし」を**ログイン画面で選べる**（🟢）

- login 画面にデモボタンを **2 つ**置く: 「デモ（ペア）」「デモ（個人）」。
- 選んだ方に応じて**デモ Cookie に `pairId` を書き分ける**:
  - ペア → 固定モック `pairId`（例 `-1`）を格納 → `session.pairId = -1`
  - 個人 → `pairId = null` を格納 → `session.pairId = null`
- `session` はデモ Cookie の値を読むだけ。URL 直叩きでも Cookie にモードが固定されるため一貫する。
- **理由**: アプリ内トグル方式（既存ペアモード＝共有 ON/OFF の Cookie）は「pairId の有無」とは別物で、
  デモ用に `session.pairId` 自体を切り替える別機構が要り実装が重い。ログイン時に確定する方が単純で堅い。

---

## 2. 変更点一覧（実装セッション向け）

| # | 対象 | 変更内容 | 種別 |
| :--- | :--- | :--- | :--- |
| 1 | 新規 `features/auth/server/demoSession.ts` | 署名付きデモ Cookie の set / clear / verify。署名は既存 `serverEnv.sessionSecret` の HMAC を流用（**改ざん検知のみが目的**。値＝pairId 有無は機密でないので暗号化不要）。Cookie に `mode: 'pair' \| 'solo'` を持たせる | 新規 |
| 2 | [session.ts](../nextjs/src/features/auth/server/session.ts) | `getSessionData` の**先頭でデモ Cookie を検証**し、有効なら DB 照会せず固定 `SessionData`（`userUid='demo-user'`, `email`=表示用固定, `pairId`=mode に応じ固定値 or null, `isDemo=true`）を早期 return。Supabase 経路は非デモ時のみ通す。**`isDemoEmail` 判定は廃止**（isDemo の真偽源は email 照合ではなくデモ Cookie の有無に変わる） | 変更 |
| 3 | [login-actions.ts](../nextjs/src/features/auth/actions/login-actions.ts) `demoLoginAction` | `signInWithPassword` 呼び出しを撤去 → デモ Cookie をセットして `redirect(afterLogin)`。**引数に mode（pair / solo）を取る**。`DEMO_USER_PASSWORD` は不要になる | 変更 |
| 4 | [login-form.tsx](../nextjs/src/features/auth/components/login-form.tsx) | デモボタンを 2 つに（「デモ（ペア）」「デモ（個人）」）。それぞれ mode を渡して `demoLoginAction` を呼ぶ | 変更 |
| 5 | ログアウト経路（[setting/logout-action.ts](../nextjs/src/app/(private)/setting/logout-action.ts) / [authActions.ts](../nextjs/src/features/auth/server/authActions.ts) `signOut`） | サインアウト時に**デモ Cookie も破棄**する（デモは Supabase セッションを持たないため、`signOut` だけではデモ Cookie が残る） | 変更 |
| 6 | [proxy.ts](../nextjs/src/proxy.ts) | **デモ Cookie 保持時もログイン済みとして扱う**（`(private)` を通す・`/login` からは afterLogin へリダイレクト）。現状は Supabase の user 判定のみのため、デモ Cookie 検出の分岐を追加。**proxy ランタイムで動くため `server-only` を付けない**流儀に合わせる（[supabaseProxy.ts](../nextjs/src/features/auth/server/supabaseProxy.ts) と同じ扱い） | 変更 |
| 7 | [env.server.ts](../nextjs/src/lib/server/env.server.ts) / [.env.example](../nextjs/.env.example) | `DEMO_USER_PASSWORD` を廃止。`DEMO_USER_EMAIL` は Auth 資格情報ではなく「デモ有効フラグ兼、画面表示用のダミー email」に格下げ（未設定ならデモ無効＝ボタンを出さない、は踏襲） | 変更 |

> **凍結資産への影響**: session.ts / demo.ts / proxy.ts / login 画面 は移行手順書 §4.2 で「認証エージェント所有の凍結資産」。
> 本変更は認証基盤に属するため、**オーケストレータ承認のうえ認証基盤の改定として扱う**（ドメインレーンの範囲外）。
> 各 feature の `demo.ts`（モックデータ）とサービス層の `withDemo*` 配線は**無変更**なので、ドメインレーンへの影響はない。

---

## 3. 実装時に詰める細部（🔵）

1. **固定 `SessionData` の中身**
   - `userUid`: 実在ユーザと衝突しない固定値（例 `'demo-user'`）。ただし `buildScopeWhere` はデモ経路では
     呼ばれない（取得はモックで早期分岐）ため scope 用途では使われない想定。値の妥当性を確認する。
   - `pairId`: pair モード時の固定値。既存モック（`demoPairedRecordList` 等）が前提とする pairId と矛盾しないか確認。
   - `email`: 画面表示（設定タブ等でメール表示があれば）用のダミー。実在 email を使わない。
2. **デモ Cookie の属性**: `httpOnly` + `sameSite=lax` + `secure`（本番）+ 有効期限（例 数時間〜1 日）。
   署名（HMAC）で改ざん検知。値は `{ mode, exp }` 程度で最小限。
3. **`getSessionData` の分岐順序**: React `cache()` メモ化は現状どおり維持。デモ分岐を最優先に置き、
   デモでない場合のみ Supabase 経路へ落ちる（現状の I/O 往復はデモでは完全にスキップされる）。
4. **proxy とデモ Cookie の検証共有**: proxy（Edge/proxy ランタイム）と Server Component 双方でデモ Cookie を
   検証するため、検証ロジックは `demoSession.ts` に集約しつつ **`server-only` を付けない**（proxy から使うため。
   supabaseProxy.ts と同じ判断）。あるいは proxy は「Cookie 存在＋署名検証」の軽量チェックのみに留める。
5. **既存モックがペア前提か個人前提かの確認**: solo モード（pairId=null）で
   `demoPairedRecordList`（精算・立替＝ペア機能）を返す画面があると不整合になる。solo 選択時に
   ペア専用画面/データをどう見せるか（空配列 or ペア画面を出さない）を各 feature のモック単位で確認する。
   ※ 本設計ではモックは無変更前提だが、solo 追加で露見する不整合があれば実装時に個別調整の可能性あり。
6. **デモ無効環境**: `DEMO_USER_EMAIL` 未設定時はデモボタンを出さない（現状踏襲）。判定は server から
   props で渡すか、Server Action 側でガードする（現状の `demoUnavailable` トースト流儀を踏襲）。

---

## 4. この変更で担保されること / されないこと

- **担保**: デモの全経路で Supabase Auth・DB へアクセスしない（認証も含めてゼロ）。実在アカウント/パスワード運用が不要。
- **担保**: 既存のモック資産（各 feature の `demo.ts`・約 600 行）と `withDemo*` 配線はそのまま活きる。
- **非対象（今回変えない）**: 書き込みの反映（no-op 維持）。デモデータの拡充・整合改善。アプリ内でのモード切替。

---

## 5. 着手前チェックリスト（実装セッション用）

- [ ] 固定 `SessionData`（userUid / pairId / email）の具体値を確定
- [ ] デモ Cookie のスキーマ（`{ mode, exp }`）と属性（httpOnly/sameSite/secure/expiry）を確定
- [ ] `demoSession.ts` の署名・検証を実装（`sessionSecret` HMAC 流用、`server-only` 非付与の是非）
- [ ] `getSessionData` のデモ早期 return と `isDemoEmail` 廃止
- [ ] `demoLoginAction`（mode 引数）+ login フォームのボタン 2 つ化
- [ ] proxy のデモ Cookie 分岐（`(private)` 通過・`/login` リダイレクト）
- [ ] ログアウト時のデモ Cookie 破棄
- [ ] `DEMO_USER_PASSWORD` 廃止（env.server.ts / .env.example / Vercel 環境変数）
- [ ] solo モードでペア前提モックが不整合を起こさないか各 feature で確認
- [ ] 動作確認: ペア/個人それぞれデモログイン → 全画面表示 → 操作が DB 非依存で通る（AGENTS.md のスクショ手順）
