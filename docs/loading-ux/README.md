# 画面遷移の体感速度を上げる（ローディング UX の設計）

- **作成日**: 2026-09-28
- **背景**: 画面遷移でデータ取得に時間がかかるとき、UI から一切のフィードバックがなく不安になる。
- **位置づけ**: 「ローディングインジケーターを足す」話ではなく、**待ち時間そのものを削る施策を先に置き、
  それでも残る待ちにだけフィードバックを出す**という順序で組んだ計画。
  凍結ルール（scope / セッション / デモ注入 / Result 型 / フォーム標準）の正は [AGENTS.md](../../AGENTS.md)。
  デザイントークン・画面の骨格の正は [docs/new-design/共通仕様.md](../new-design/共通仕様.md)。
- **凡例**: 🔴=体感への効果が大きい / 🟡=中 / 🔵=保険（🔴 が効けば出番が減る）

---

## 調査で分かった「遅さ」の正体

対策を決める前に現物を読んだ。遅さの原因は 1 つではなく、**4 つが積み重なっている**。

### 原因 1: Function と DB が太平洋を挟んでいる 🔴

[next.config.ts](../../next.config.ts) のコメントが既にこれを記録していた。

> 日本のユーザ → 米国の Function → Supabase という経路になり DB クエリのたびに太平洋を往復する

`.env` の接続先は `aws-0-ap-northeast-1`（東京）、Vercel の Function リージョンは既定の `iad1`（米国東部）。
**1 クエリあたり往復 100〜200ms 級の固定費**が乗る。クエリ自体が軽くても、回数が増えれば線形に効く。

これが本件の最大の要因。以降の原因 2〜3 は「その固定費を何回払うか」の話になる。

### 原因 2: 共通 layout が全画面をブロックしている 🔴

[src/app/(private)/layout.tsx](../../src/app/%28private%29/layout.tsx) が先頭で

```tsx
const session = await requireAuth();
const [typeList, methodList, isPair] = await Promise.all([...]);
```

としている。この `typeList` / `methodList` は**入力モーダルを開いたときにだけ使う候補データ**で、
初期表示には要らない。にもかかわらず layout の top-level で await しているため、

- `(private)` 配下の**全画面**が、この解決を待つまで 1px も描画できない
- 静的シェルが存在しないので、[tab-bar.tsx](../../src/components/tab-bar.tsx) の `prefetch={true}` が**空振りする**

Next.js 16 の `streaming.md`「Push dynamic access down」が明示的に警告している構造。

> If you `await` any of these at the top of a layout or page, everything below that point
> becomes dynamic and cannot be prerendered as part of the static shell.

つまり現状、**タブ遷移は prefetch の恩恵をまったく受けていない**。

### 原因 3: 毎リクエスト必ず走る DB クエリがある 🔴

**当初は「不変マスタの取り直し」だけの 🟡 と見ていたが、調査で 🔴 に格上げした。**

#### 3-a. セッション取得が毎回 DB 2 クエリ

[session.ts](../../src/features/auth/server/session.ts) の `getSessionData` は
`findUserBySupabaseUid`（UID 突合）と `getPairId`（ペア照会）で**毎リクエスト DB 2 クエリ**を叩く。

`requireAuth()` は多層防御として**全 Server Component / Server Action の先頭で呼ばれる**ため、
この 2 クエリは**アプリのあらゆる操作に乗る最大の共通費**。原因 1 の固定費が毎回 2 回分かかる。

このファイルには既に「画面遷移ごとに RSC が再実行されるため、この往復がモバイル回線で
体感遅延に直結していた」として `getUser()` → `getClaims()` で **JWT の HTTP 往復を消した**
最適化の記録がある。**その努力の結果、いま残っている固定費がこの DB 2 クエリ**。
React `cache()` は per-request なので、リクエストをまたぐと必ず払い直す。

#### 3-b. 不変マスタも毎リクエスト取り直している

`getTypeCardList` / `getMethodCardList` はそれぞれ内部で
`findTypeRows` + `getColorClassificationList` を叩くので、layout だけで **4 クエリ**走る。

うち `getColorClassificationList`（[colorClassification.ts](../../src/features/master/server/repositories/colorClassification.ts)）は
**19 行の全ユーザ共通・不変マスタ**。同じく `cache()` の per-request メモ化しかない。

3-a と 3-b を合わせると、**カレンダーを開くだけで最低 6 クエリ**が太平洋を往復する。

### 原因 4: カレンダーの月送りだけ楽観的更新が抜けている 🔴

集計画面（[summary-screen.tsx:115](../../src/features/summary/components/summary-screen.tsx#L115)）は**正しく**実装されている。

```tsx
const load = (next: Query) => {
  setYearMonth(next.yearMonth);   // ← 先に画面を切り替える
  startTransition(async () => {    // ← データは後から差し替える
    setData(await fetchPieAction({ ... }));
  });
};
```

年月・タブは即座に変わり、本文は `opacity-60` + `aria-busy` で更新中と分かる。理想的な形。

対してカレンダー（[calendar-screen.tsx:93](../../src/features/calendar/components/calendar-screen.tsx#L93)）は

```tsx
const moveMonth = (delta: number) => {
  const nextYearMonth = shiftMonth(month.yearMonth, delta);
  startTransition(async () => {
    setMonth(await getCalendarMonthAction(nextYearMonth));  // ← 応答後にしか変わらない
  });
  setSelectedDate(`${nextYearMonth}-01`);
};
```

`month` state はサーバ応答が返るまで前月のまま。`isPending` は**ボタンを disabled にするためだけ**に使われ、
月見出しもグリッドも一切変化しない。**ユーザから見ると完全な無反応**。

家計簿では「先月を見る」はタブ切り替えより頻度が高いはずで、体感の主犯はここ。
新しい設計を発明する必要はなく、**集計側の既存パターンに揃えるだけ**で解ける。

---

## 方針

UX の原則として、**人は「待つこと」には耐えられるが「反応がないこと」には耐えられない**。
そして 0.1 秒以内に何かが変われば、その後 1〜2 秒待っても「壊れた」とは感じない。

このアプリはスマホ幅 448px のタブ UI で、ネイティブアプリの挙動を期待される。
**タブ切り替えにスケルトンを出した時点で負け**なので、優先順位はこうなる。

| 優先 | やること | 効果 |
| --- | --- | --- |
| 1 | 待ち時間そのものを削る（原因 1〜3） | ローディング UI を**出さなくて済む**状態にする |
| 2 | 押した瞬間の反応を作る（原因 4・押下 FB） | 0.1 秒で不安を消す |
| 3 | それでも残る待ちにだけ FB を出す | 最後の保険 |

**スケルトンは最後**。先に置くと、遅いことを前提にした作りに引きずられる。

### スケルトンをこのデザインの言語で作る

[共通仕様.md](../new-design/共通仕様.md) は「影は使わない」「アニメーションは列挙された箇所のみ」
という強い抑制で成立しており、カレンダーのセル罫線まで色トークンが決まっている。
そこへ既製の `animate-pulse` のグレー矩形を持ち込むと**デザインの外から来た異物**になる。

そこで次の 3 つを守る。

1. **脈打たせない**。`animate-pulse` は「待て」という指示で、このデザインの語彙にない。
   既存の `--fill-soft`（日付ボタンの地）/ `--line-soft`（カード内の薄い区切り）＝
   「まだ意味を持たない面」を表す色だけで組む。
2. **骨格は実寸で置く**。カードの白面 r16、行 h48、色丸 32px、右のシェブロンは本物を置く。
   欠けているのは**色と文字だけ**。データが届いてもレイアウトが 1px も動かない。
   これがスケルトン本来の目的で、形が動くくらいなら出さない方がまし。
3. **120ms の遅延フェードイン**。スケルトンは最初から DOM に置きつつ `opacity: 0` で始め、
   120ms 後にフェードインさせる。施策 1〜3 の後は多くのケースで 120ms 以内にデータが届くので、
   **スケルトンは一度も見えない**。遅いときだけ静かに現れる。チラつきゼロ。

形が可変な画面（カレンダーの記録数、集計のカテゴリ数）でセルの数まで作り込むと
**実データと違ったときに嘘になる**ので、そこは枠と見出しだけに留める。

---

## タスク一覧（依存順）

状態: `[ ]` 未着手 / `[~]` 着手中 / `[x]` 完了

| 状態 | ID | タスク | 効果 | 依存 |
| --- | --- | --- | --- | --- |
| [x] | L01 | Vercel Function を東京リージョン（`hnd1`）へ | 🔴 全クエリの往復を短縮 | なし |
| [x] | L02 | カレンダー月送りの楽観的更新（集計のパターンに揃える） | 🔴 無反応を解消 | なし |
| [x] | L03 | `(private)/layout.tsx` の await をモーダルへ押し下げ | 🔴 静的シェルを作り prefetch を実効化 | なし |
| [x] | L04 | Cache Components 導入（session の `use cache: private` ＋静的マスタ） | 🔴 全操作に乗る DB 2 クエリを削減 | L03 と一体 |
| [x] | L05 | 押下フィードバック（タブバー・設定の行） | 🟡 0.1 秒の反応 | L03 |
| [x] | L06 | `Skeleton` 部品と `loading.tsx`（形が確定した画面のみ） | 🔵 最後の保険 | L03, L05 |

---

## L01 🔴 Vercel Function を東京リージョンへ

### やること

[vercel.json](../../vercel.json) に `"regions": ["hnd1"]` を足す。

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["hnd1"]
}
```

next.config.ts のコメント（「今回は変更しない判断」）は移行時のもので、
本件はまさにその判断を見直す作業。**コメントも現状に合わせて直す**。

### 効く理由

原則どおり「クエリ回数の多い DB 側に寄せる」。1 画面が 4〜6 クエリ投げるなら、
往復 150ms × 6 = 900ms が、同一リージョン内の数 ms × 6 に変わる。
**コード 1 行も触らずに最大の改善が得られる**ので最優先。

### 注意

- Vercel の Hobby プランはリージョン指定が 1 つだけ（`hnd1` 単独指定なので問題なし）。
- 効果測定はデプロイ後に実機で。ローカル開発では体感できない（ローカル → 東京 Supabase は元々近い）。
- **これは本番の配信構成を変える作業**なので、適用は人間の判断で行う。
  本タスクではファイルを用意するところまでとし、デプロイはユーザに委ねる。

---

## L02 🔴 カレンダー月送りの楽観的更新

### やること

[calendar-screen.tsx](../../src/features/calendar/components/calendar-screen.tsx) の `moveMonth` を、
集計画面と同じ「先に画面、後からデータ」の形へ揃える。

`month` state は `CalendarMonthData`（`yearMonth` / `days` / `plans` / `reminders` / `monthSum`）を
1 つの塊で持っているため、そのままでは「年月だけ先に進める」ができない。
**表示中の年月を `month.yearMonth` から独立した state に分離する**。

```tsx
// 表示中の年月。データより先に進むので month とは別に持つ。
const [yearMonth, setYearMonth] = useState(initial.month.yearMonth);
const [month, setMonth] = useState<CalendarMonthData>(initial.month);

const moveMonth = (delta: number) => {
  const next = shiftMonth(yearMonth, delta);
  setYearMonth(next);                      // 月見出し・グリッドの枠が即座に進む
  setSelectedDate(`${next}-01`);
  startTransition(async () => {
    setMonth(await getCalendarMonthAction(next));
  });
};
```

これに伴い、**年月から導ける表示はすべて `yearMonth` を見るようにする**。

- 月見出し（`const [year, monthPart] = ...`）→ `yearMonth` から
- グリッドの枠（`buildMonthGrid`）→ `yearMonth` から（**日付の並びはサーバを待たずに計算できる**のがポイント）
- 記録のドット・金額・予定の帯（`daySums` / `lanes`）→ `month` のまま（サーバ待ち）

### 古い月のデータを出さない

`yearMonth` が進んでも `month` は前月のままなので、
**そのままだと 9 月の枠に 8 月の記録が乗る**（最も避けたい嘘の表示）。

`month.yearMonth !== yearMonth` のときは日別データを空として扱う。

```tsx
// データが表示中の月に追いつくまでは、日別の値を出さない（前月の値が新しい枠に乗るのを防ぐ）。
const isStale = month.yearMonth !== yearMonth;
const daySums = useMemo(
  () => (isStale ? new Map() : new Map(month.days.map((d) => [d.dateStr, d]))),
  [isStale, month.days]
);
```

`lanes`（予定の帯）と月収支、`DayDetailList` も同様に `isStale` を見る。

### 更新中の見せ方

集計画面に合わせ、日別データを持つ範囲だけ `opacity-60` + `aria-busy` を付ける。
**月見出しと曜日行には付けない**（そこは確定した情報なので薄くする理由がない）。

`MonthNavButton` の `disabled={isPending}` は**外す**。
月送りは連打してその場で数か月進めたい操作で、1 往復ごとに待たされるのは体験として悪い。
`startTransition` は後発の更新が勝つので、連打しても最後の月に収束する。

> ただし `setMonth` は素の state なので、**古い応答が後から届くと巻き戻る**可能性がある。
> 応答に含まれる `yearMonth` が現在の `yearMonth` と一致するときだけ反映する形にして塞ぐ。
> `CalendarMonthData` は `yearMonth` を持っているのでそのまま使える。

### 確認

- 月送りを押した瞬間に見出しとグリッドが変わる
- 前月の記録が新しい月に乗らない
- 連打しても最後に押した月に落ち着く

---

## L03 🔴 layout の await をモーダルへ押し下げ

### やること

[(private)/layout.tsx](../../src/app/%28private%29/layout.tsx) が候補データを**解決済みの値ではなく Promise で**
`NoteModalProvider` へ渡し、モーダルが開いたときに初めて `use()` で読む。

```tsx
export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  // 候補は入力モーダルを開くまで要らない。await せず Promise のまま渡し、
  // layout がシェルを即座に返せるようにする（= 静的シェルが生まれ prefetch が効く）。
  const candidates = Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getEffectivePairMode(session)
  ]).then(([typeList, methodList, isPair]) => ({ ... }));

  return ( ... <NoteModalProvider candidatesPromise={candidates}> ... );
}
```

受け側（[note-modal.tsx](../../src/features/record/components/note-modal.tsx)）は
`RecordSheet` を `<Suspense>` で包み、中で `use(candidatesPromise)` する。

### `requireAuth()` の await は残す

これは**認証ガードなので押し下げてはいけない**。未ログインを検出して `redirect` する役目があり、
Suspense の中に落とすと「シェルが出てから弾かれる」ことになる。

ただし `getSessionData` は Cookie を読むだけで **DB には行かない**（要確認）ので、
ここは往復コストを払っていない可能性が高い。L03 の目的は DB 3 クエリを外すこと。

> 着手時に `features/auth/server/session.ts` を読んで、`getSessionData` が DB を引くか確認する。
> 引いているなら、そこが全画面共通の固定費になるので別途検討する（本計画の対象外だが記録する）。

### モーダルを開いた瞬間に候補が無い問題

Promise は layout のレンダリング時に**開始**されるので、ユーザが ＋ を押す頃には
ほぼ確実に解決済み。未解決なら Suspense のフォールバックが出る。

そのフォールバックは**入力シートの骨格**（グラバー・ヘッダ・主ボタンの枠）にする。
シートは全高固定（`top: 56px`）で形が決まっているので、スケルトンが嘘にならない数少ない箇所。

### デモモードへの影響

`withDemoRead` を通る呼び出しをそのまま Promise 化するだけなので、デモ側の変更は不要。
念のためデモログインで入力モーダルを開いて候補が出ることを確認する。

---

## L04 🔴 Cache Components の導入とキャッシュ設計

**当初は「色マスタのメモ化」だけの 🟡 タスクだったが、`cacheComponents` 導入が承認されたため
本計画で最も効果の大きいタスクに変わった。** 色マスタは、そのうちの 1 項目に格下げになる。

### なぜ効果が大きいと分かったか

[session.ts](../../src/features/auth/server/session.ts) を読んだところ、`getSessionData` は
**毎リクエスト DB 2 クエリ**を叩いていた。

- `findUserBySupabaseUid(claims.sub)` … Supabase UID → アプリ uid の突合
- `getPairId(appUser.uid)` … ペア照会

このファイルには既に「画面遷移ごとに RSC が再実行されるため、この往復がモバイル回線で
体感遅延に直結していた」として **`getUser()` → `getClaims()` で JWT の HTTP 往復を消した**
最適化の記録がある。その努力の結果、**いま残っている固定費がこの DB 2 クエリ**。

`requireAuth()` は多層防御として**全 Server Component / Server Action の先頭で呼ばれる**ので、
この 2 クエリは**アプリのあらゆる操作に乗る最大の共通費**。React `cache()` は per-request なので
リクエストをまたぐと必ず払い直す。

`use cache: private` はまさにこのためのもので、**Cookie を読む関数をキャッシュでき、
結果はブラウザにのみ保持されサーバには残らない**。ペア家計簿の性質上、これは重要な性質。

### 設計

Next.js 16 の `authentication-with-cache-components.md` のパターンに、このアプリの
既存規約（Data Access Layer 相当の `requireAuth` / scope / デモ注入）をそのまま載せる。

#### 1. `getSessionData` に `use cache: private`

```ts
export async function getSessionData(): Promise<SessionData | null> {
  'use cache: private';
  cacheLife('minutes');
  // 以下は現状のまま（デモ Cookie → getClaims → users 突合 → pairId）
}
```

- `cookies()` を読むのでサーバキャッシュ（素の `use cache`）は使えない。`private` が唯一の選択肢。
- **`cacheLife` は既存のトレードオフ記述と整合させる**。session.ts は既に
  「ローカル検証はトークン失効を即座に反映せず、exp（既定 1 時間）までは有効」を
  **許容と判断**している。キャッシュ寿命はそれより**短く**取るので、
  失効の反映が今より遅くなることはない。`minutes` を基本とし、着手時に `cacheLife` の
  プロファイル定義を読んで確定する。
- React `cache()` は**外さない**。per-request メモ化はキャッシュミス時の重複 I/O を畳む役割で、
  `use cache: private` と層が違う。両立するか着手時に検証し、競合するなら `cache()` を外す。

> **要検証**: `redirect()` を含む `requireAuth` をキャッシュ対象にしてよいか。
> ドキュメントは「`redirect()` は throw して描画を中断するので、キャッシュされるのは
> 解決したユーザだけ」と明記している。`requireAuth` はこの形に一致するが、実挙動を確認する。

#### 2. layout から session 読みを押し下げる

ドキュメントの指示：

> Keep the session read out of a layout's top level, too. A top-level `await` on the session
> in a layout holds the whole segment, including `{children}`, behind that request.

これは **L03 でやることと同じ**。L03 は「候補データ 3 クエリを押し下げる」だったが、
`cacheComponents` 下では **`requireAuth()` の await も同じ扱い**になる。
つまり L03 と L04 は分離できず、**まとめて 1 つの作業**になる。

ただし `requireAuth` は認証ガードなので、Suspense の中に落とすと
「シェルが出てから弾かれる」ことになる。**認可の正しさは proxy 側のガードが担保**しており
（AGENTS.md「Proxy に加えた多層防御」）、`requireAuth` は多層防御の 2 枚目。
未認証で `(private)` に到達する経路は proxy が塞いでいるので、
**シェルが一瞬出てからリダイレクトされても情報漏洩にはならない**（シェルはデータを持たない）。

> この判断は**セキュリティに関わる**ので、着手時に proxy の実装を読んで裏を取る。
> 裏が取れなければ `instant = false` で `(private)/layout.tsx` を据え置き、
> L03 の候補押し下げだけ行う（それでも DB 3 クエリは外れる）。

#### 3. 静的マスタに素の `use cache`

`getColorClassificationList`（19 行・全ユーザ共通・不変）は `cookies()` を読まないので
素の `use cache` が使える。サーバキャッシュに載るので**全ユーザで共有**され、最も効率がいい。

```ts
export async function getColorClassificationList(): Promise<ColorClassification[]> {
  'use cache';
  cacheLife('days');
  cacheTag('color-classification');
  return prisma.colorClassification.findMany({ ... });
}
```

`day_classification` など他の静的マスタがあれば同様に扱う（着手時に `features/master` を棚卸し）。

#### 4. ユーザ別データは「id を渡す」形に

ドキュメント Step 4 のパターンは、**このアプリの scope 規約と完全に整合する**。

```ts
// 公開の getter がセッションを解決し、id だけを渡す。
export async function getTypeCardList(session: SessionData) { ... }

// キャッシュ関数は非公開にする（他ユーザの id を渡して引けないようにする）。
async function findTypeRowsCached(userUid: string, pairId: number | null) {
  'use cache';
  cacheTag(`type:${userUid}`);
  ...
}
```

> Keep `getNotesByUserId` unexported so a caller can't request another user's notes
> by passing a different id.

AGENTS.md の scope 規約（`buildScopeWhere` / `buildOwnerScopeWhere` を必ず通す）と
同じ考え方なので、規約違反にはならない。**ただしキャッシュキーに scope を過不足なく
含めること**が新しい責務として増える（`userUid` だけでなくペアモードも鍵に要る）。

**これは本計画の範囲を超える**ので、L04 では**やらない**。`use cache: private` による
session のキャッシュと、静的マスタの `use cache` までに留める。
ユーザ別データのキャッシュは、効果を測ってから別タスクとして検討する。

### 進め方（段階導入）

`cacheComponents: true` を入れると、**動的 API を Suspense 外で使う箇所すべてがビルドエラー**になる。
一度に直そうとすると失敗するので、ドキュメントが用意している段階導入に乗る。

1. `next.config.ts` に `cacheComponents: true` を入れる
2. **codemod で全ルートを検証から除外する**

   ```bash
   npx @next/codemod@canary cache-components-instant-false ./src/app
   ```

   `export const instant = false` が全 `page` / `layout` / `default` に入り、
   **まずビルドが通る状態**を作る。`instant = false` は「ブロックしてよい」という印で、
   動的にするわけではない（静的にできるルートは静的シェルを持つ）。

   > `./src/app` を渡すこと（`src/` 構成のため）。パスを間違えると失敗せず `0 ok` と出る。

3. **1 画面ずつ `instant = false` を外して検証エラーを潰す**。順序は
   `(private)/layout.tsx` → `calendar` → `summary` → `bank` → `setting` の順
   （共通 layout が直らないと配下は直せない）。
4. 各段階で `pnpm build` と `pnpm test` を通す。

**L04 は 2 と 3 の「`(private)/layout.tsx` まで」をゴールとする。**
各画面の `instant = false` 剥がしは、効果を測ってから個別に進める。

### 注意（既存機能との衝突）

- **デモモード**: `withDemoRead` / `withDemoWriteVoid` を通る経路は Cookie を読む。
  キャッシュ層を挟んでデモ判定が混ざらないか確認する
  （`getSessionData` の中でデモ Cookie を読んでいるので、`use cache: private` の
  キャッシュキーに Cookie が含まれれば問題ないはず。**着手時に実挙動で確認**）。
- **ペアモード切替**: `setPairMode` は `revalidatePath` で再検証している。
  `use cache` 化した関数には `cacheTag` + `revalidateTag` が要るかもしれない。
  ペアモードを切り替えて**古いスコープのデータが残らない**ことを必ず確認する
  （これは情報漏洩に直結するので、本タスクで最も慎重に見る点）。
- **Server Action からの再検証**: 記録の保存・削除後に一覧が更新されることを確認する。
### 着手して分かったこと（L03 / L04 の確定事項）

- **`getSessionData` は DB を引いていた**。L03 の「要確認」は黒。`use cache: private`
  （`cacheLife('minutes')`）を React `cache()` の内側に重ねた。両者は層が違い共存する。
  寿命は JWT の `exp`（既定 1 時間）より短いので、失効の反映が今より遅くなることはない。
- **`requireAuth()` を Suspense 内へ落とす判断は裏が取れた**。[proxy.ts](../../src/proxy.ts) の
  matcher は静的アセットを除く全パスを通し、未ログインは `/login` へリダイレクトする。
  実際に未認証で `/calendar` を叩くと 307 で弾かれることを確認した。加えて生成された
  `calendar.html`（3KB）に記録・金額・TODO のいずれも含まれないことを grep で確認済み。
- **段階導入は共通 layout まででシェルが出た**。`(private)/layout.tsx` の `instant = false`
  を外しただけで `(private)` 配下の全ルートが `ƒ`（動的）から `◐`（Partial Prerender）に
  変わり、`calendar.html` などの静的シェルが生成された。各画面の `instant = false` 剥がしは
  未着手のまま残してよい。
- **`instant = false` が要らなかった箇所は戻した**。codemod は全 `page`/`layout` に入れるが、
  データを読まない `(auth)` 配下・ルート・`(tabs)/layout.tsx` は外してもビルドが通る。
  結果、印が残るのは「セッション由来の取得を持つ 15 画面」だけになっている。
- **`route.ts` は codemod の対象外**。`api/cron/post-records` の
  `export const dynamic = 'force-dynamic'` が `cacheComponents` と非互換でビルドが落ちる。
  Cache Components では全ページが既定で動的なので、この宣言は削除した。
- **ペアモード切替・デモの無害性は実挙動で確認した**。キャッシュに載せたのは
  「全ユーザ共通・不変の色マスタ（素の `use cache`）」と「ブラウザにのみ残る session
  （`private`）」だけで、scope を持つデータ（records / types / methods）は一切キャッシュ
  していない。デモの入力モーダルで候補が個人／共有で入れ替わること、保存が no-op で
  成功することをデモログインで確認した。

---

## L05 🟡 押下フィードバック

### やること

「押したのに何も起きない」時間を 0.1 秒で消す。**待ち時間を隠すのではなく、受け付けたことを示す**。

Next.js の `useLinkStatus`（`next/link`）で、遷移が始まってから完了するまでを取れる。
`<Link>` の**子孫でしか使えない**ので、タブの中身を小さなクライアント部品に切り出す。

対象は 2 つ。

1. **タブバー**（[tab-bar.tsx](../../src/components/tab-bar.tsx)）
   遷移中のタブを、選択中の見た目（`bg-line-soft` + `text-primary`）へ**先に**寄せる。
   スピナーは足さない。「押したタブがもう選ばれている」ことが分かれば十分で、
   アイコンが回るより静かで、このデザインに合う。

2. **設定の行**（`ListCell` 等の `<Link>` を持つ行）
   iOS のテーブルビューと同じく、押下〜遷移完了まで行の地を `--fill-soft` にする。
   既にタップの反応がある場合はそれを活かす。

`prefers-reduced-motion` を尊重する。どちらも色の変化だけなので問題にならないが、
トランジションを足すなら `motion-reduce:transition-none` を付ける。

### 着手時に確認すること

`useLinkStatus` が Next.js 16.3.5 に存在するか、`node_modules/next/dist/docs` で裏を取ってから書く。
無ければ `usePathname` + `useTransition` で同等のことをする。

---

## L06 🔵 Skeleton 部品と loading.tsx

L01〜L05 が効けば出番は減るが、**初回訪問（prefetch が無い）と低速回線では依然として必要**。

### やること

#### 1. `src/components/ui/skeleton.tsx`

方針どおり、脈打たない・骨格は実寸・120ms 遅延フェードイン。

```tsx
// 「まだ意味を持たない面」を --fill-soft で出す。脈打たせない（共通仕様の抑制に合わせる）。
// 120ms 遅れてフェードインさせ、速いときは一度も見えないようにする。
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-[skeleton-in_160ms_120ms_both]', 'rounded bg-fill-soft', className)} />;
}
```

`@keyframes skeleton-in`（opacity 0 → 1）を `globals.css` に足す。
`@media (prefers-reduced-motion: reduce)` では遅延だけ残して即表示にする。

#### 2. `loading.tsx` を置く画面を選ぶ

**形が確定している画面にだけ置く**。可変な画面は枠と見出しだけ。

| 画面 | 置くもの |
| --- | --- |
| `(tabs)/setting` | 行数・タイル・シェブロンまで実寸（形が完全に確定） |
| `(tabs)/setting/*`（type / method / bank 等） | カード枠 + 数行。行数は控えめに |
| `(tabs)/bank` | ヘッダ + カード枠。グラフは枠のみ |
| `(tabs)/calendar` | **月見出し + 曜日行 + グリッドの枠まで**。記録のドットは出さない |
| `(tabs)/summary/*` | ヘッダ + 年月 + カード枠。円グラフ・棒は枠のみ |

カレンダーのグリッドは**日付の並びが確定して計算できる**ので、枠だけでなく日付の数字まで出せる。
ただし `loading.tsx` は Server Component として静的に評価されるため、
「今日が何月か」に依存する部分は出せない。**枠と曜日行に留める**のが安全。

#### 3. `(tabs)/layout.tsx` 直下に共通の `loading.tsx` は置かない

置くと 4 タブすべてに同じ骨格が出てしまい、形の違う画面で嘘になる。**画面ごとに置く**。

---

### 着手して分かったこと（L05 / L06 の確定事項）

- **`useLinkStatus` は Next.js 16.3.5 に存在した**。代替（`usePathname` + `useTransition`）は不要。
  ただし `Link` の子孫でしか使えないので、タブの中身と行の地をそれぞれ小さなクライアント
  部品（`TabContent` / `ListCellPending`）に切り出している。
- **Tailwind v4 では `[animation:...]` の任意値が効かなかった**。`@keyframes` を
  `globals.css` の末尾に素で書き、ユーティリティを任意値で当てる書き方だと、
  キーフレームは出力されるのにユーティリティのルールが生成されず、
  `prefers-reduced-motion` の上書きだけが残る（= アニメーションが無いのに
  `animation-duration: 0s` を当てる）状態になった。`@theme inline` に
  `--animate-skeleton-in` として登録し、`@keyframes` もその中に置くのが正解。
  ビルド後の CSS に `.animate-skeleton-in{animation:.16s .12s both skeleton-in}` が
  出ることで確認した。
- **速い遷移では骨格は一度も出ない**。設定への遷移を MutationObserver で観測すると
  骨格の挿入は 1 回起きるが、150ms 後にはもう実体に入れ替わっている。120ms の遅延が
  意図どおり効いており、L06 が「最後の保険」である位置づけは実測とも合う。

---

## やらないこと（意図的な除外）

- **画面全体を覆うローディングインジケーター**
  タブバーやヘッダという「もう出せるはずのもの」まで隠してしまう。
  スマホアプリ的なこのアプリの性格に合わない。
- **各画面の `instant = false` 剥がしを一度に行うこと**
  `cacheComponents` は導入するが（L04）、検証エラーの解消は
  `(private)/layout.tsx` までをゴールとする。各画面は効果を測ってから個別に進める。
- **ユーザ別データ（記録・集計）のキャッシュ**
  `use cache` + `cacheTag` で可能だが、キャッシュキーに scope を過不足なく含める
  責務が増え、取り違えると**情報漏洩に直結する**。L04 に設計だけ記し、実装はしない。
- **`partialPrefetching` の導入**
  `cacheComponents` の効果を測ってから別途検討する。
- **カテゴリ・方法のブラウザキャッシュ**
  L04 に理由を記載。
- **`animate-pulse` の一律適用**
  L06 の方針に記載。

---

## 進め方

1. **L01 → L02 を先に**。この 2 つは独立して効き、リスクも小さい。
   L01 はコード 0 行、L02 は 1 ファイルで無反応が消える。
2. **L03 と L04 は一体で進める**。`cacheComponents` 下では layout の `await` の扱いが
   L03 の押し下げと同じ話になるため、分けると二度手間になる。
   ここが本計画で最もリスクの高い区間なので、**ペアモード切替でスコープが混ざらないこと**を
   最重要の確認項目とする。
3. L01 は**本番の配信構成を変える**ので、ファイルを用意して人間がデプロイする。
4. L03 + L04 の後に体感を測り、**L05 / L06 の要否を判断する**。
   十分速くなっていれば L06 のスケルトンは最小限で済む。
5. 各タスクで `pnpm check:full` と `pnpm test` を通す。
6. 画面確認はデモログインで（[AGENTS.md](../../AGENTS.md)「画面の動作確認」）。
   スクリーンショットは `.screenshots/` に連番＋画面名。
7. コミットはタスク単位。完了したら本書の状態を更新する。
