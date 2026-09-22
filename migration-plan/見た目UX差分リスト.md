# かけよ Next.js 移行：見た目・UX 差分リスト（旧Vue版 → Next版）

- **作成日**: 2026-09-22
- **目的**: このセッションの UX 改善方針として、**「Vue版の見た目・UX を維持して React版を作る」** ために、両版で**見た目（視覚デザイン）・操作感（インタラクション）が異なる箇所**を洗い出す。
- **調査範囲**: 旧 `kakeyo/`（pages / components / layouts / plugins / composables）× Next `kakeyo/nextjs/src/`（app / features / lib / globals.css）を、**レイアウト・カラー以外の見た目・タップ操作性・アイコン表現・体感速度**の観点で突き合わせた。
- **既存リストとの棲み分け**: [機能差分リスト.md](機能差分リスト.md)（別セッションで対応中）は**機能・API・ドメインロジックの欠落**が主軸。本リストは**見た目・UX の後退**に絞り、既存リストと**重複しない新規差分**、または既存で「存在の言及のみ」だった項目の**視覚UX詳細の深掘り**のみを記載する。
- **色は対象外**: ユーザー方針により、色は CSS でどうにでもなるため差分対象から除外（ただし「色以外の視覚シグナルが色ドット1個に退化した」等、情報設計としての後退は記載する）。
- **凡例**: 🔴=UX の明確な後退（優先対応） / 🟡=見た目の後退・質感低下 / 🔵=要確認（実機/デザイン判断が要る） / **✔=本対応で解消済み**
- **ユーザーが特に気にしている4点**: ①定期record設定 ②金額の電卓入力 ③共有トグルの毎回fetch（登録を急ぎたいのに待たされる）④カレンダー画面のUIが全然違う ＋ 共有アイコンが文字Tag化 → アプリ共通でアイコン統一したい。→ 本リストの **U-1 / U-2 / U-3 / G群** が直接対応。

> **✔ 対応状況（2026-09-22 B系 UX 復元セッション）**: [機能差分リスト.md](機能差分リスト.md) の B 系対応と一体で、共通コンポーネント化により以下を解消。**U-1（電卓）→共通 `PriceKeypad`**（note 記録/定期に適用）、**U-4（FullCalendar カスタム CSS）→ globals.css へ移植＋標準ツールバー廃し独自ヘッダー一本化**（今日=黄・曜日=赤青・小フォント・余白詰め・daySum 黒点除去・年月重複解消）、**G-1/H-1（共有シグナルの色ドット退化）→共通 `ShareBadge`**（色マーカー＋共有アイコン内包）を `RecordCard` で使用。C-1（calendar 選択日カード）/ J-3（records 色帯）も `RecordCard` 適用で情報密度を復元。**U-2（定期一覧）・U-3（共有トグル体感）・I 群（グラフ装飾）・K/L 群（ダイアログ/確認質感）は本セッション未着手**（別途）。

> **総括**: 機能は概ね移植済み（機能差分リスト参照）だが、**見た目・操作感は「Vuetify で作り込まれたコンパクトで家計簿らしい UI」から「素の shadcn / ネイティブ HTML 要素の汎用フォーム」へ全般に平坦化**している。最も影響が大きいのは **①金額の電卓入力の廃止 ②カレンダーの FullCalendar カスタム CSS 未移植（今日=黄・曜日=赤青・小フォント・詰め余白が全消失）③共有トグルの毎回サーバ往復（Vueは即時・fetchゼロ）④共有シグナルが人物アイコン→色ドット/文字に退化**の4点。データは揃っており、多くは **View 層の作り込みだけで解消可能**。

---

## G. 🔴🟡 アプリ横断（全画面に効く土台の見た目差）

### G-1. 共有(ペア)の視覚シグナルが「人物アイコン統一」から「色ドット/文字」へ退化 ★要望の核心 ✔ 部分解消（RecordCard で ShareBadge 使用。他画面への横展開は別途）
- **Vue版**: アプリ全体で共有表現を `$ICONS.SHARE`（= `mdiAccountMultiple`＝**2人の人物アイコン**）に統一。RecordCard のアバター内・RecordCardHalf・records/summary 見出し・calendar 共有メモ・note 入力まで、`isPair`/立替/精算を**一貫して人物アイコン**で表す（[icons.ts:77](../plugins/icons.ts) / [RecordCard.vue:15,23,51](../components/RecordCard.vue) / [RecordCardHalf.vue:17](../components/RecordCardHalf.vue)）。
- **React版**: 共有表現が **3種類に分裂**している：
  1. `Share2`（lucide の共有ノード図。**2人アイコンとは別物**）＝ ヘッダートグル / calendar 予定・リマインダー詳細（[pair-mode-switch.tsx:33](../nextjs/src/features/layout/components/pair-mode-switch.tsx) / [event-detail.tsx:71,154](../nextjs/src/features/calendar/components/event-detail.tsx)）
  2. **アイコン消失 → 色ドットのみ** ＝ records 明細カード / カレンダー日別 record 一覧（共有/立替/精算の区別が視覚的に消える。[records-screen.tsx:112-125](../nextjs/src/features/summary/components/records-screen.tsx) / [day-record-list.tsx:27-51](../nextjs/src/features/calendar/components/day-record-list.tsx)）
  3. **文字** ＝ 精算タブの `自分`/`相手`（[summary-settlement.tsx:127](../nextjs/src/features/summary/components/summary-settlement.tsx)）、リマインダーの文字バッジ（[event-detail.tsx:158](../nextjs/src/features/calendar/components/event-detail.tsx)）
- **差の要点**: 「アプリ共通で絵アイコンに統一」の要望に対し、現状は (a) アイコン種別が `mdiAccountMultiple`(2人) → `Share2`(共有ノード) で**意図とズレ**、(b) 一部は**アイコンが消えて色ドット1個 or 文字に退化**して統一が崩れている。**record_type(0/5/10/15) の出し分けデータは React 側に導出済み（`isPair`/`isInstead`/`isSelf`/`isSettlement`）**なので、**View 層のアイコン差し替えだけで統一可能**（データ追加不要）。統一するなら lucide の `Users`/`UsersRound`（2人）が Vue の `mdiAccountMultiple` の意図に最も近い。
- **対応方針メモ**: 共有シグナル用の共通アイコンコンポーネント（例 `&lt;ShareBadge type={recordType} /&gt;`）を1つ作り、records/calendar/summary/note/setting 全所で使い回す。`Share2` を含め全箇所を統一。

### G-2. 背景の幾何学模様パターンが消失し、真っ白な無地に
- **Vue版**: `v-main` に `bg-geometric-pattern`（radial-gradient のドット＋斜め線グリッドの幾何学模様。lightsteelblue のドット＋グレー斜線、109px タイル）を敷き、全画面に固有のテクスチャがあった（[default.vue:252-276](../layouts/default.vue)）。
- **React版**: 背景は `--background: oklch(1 0 0)`（**純白・無地**）。パターン CSS は存在しない（[globals.css](../nextjs/src/app/globals.css) に geometric/pattern の記述なし）。
- **差の要点**: アプリの地の視覚アイデンティティ（模様のある背景）が失われ、のっぺりした白背景に。カード類とのコントラストも変わる。
- **対応方針メモ**: 色対象外の方針だが「模様の有無」は情報でなく質感なので判断が要る。復活させるなら `body` へ同等の CSS グラデーション背景を1箇所追加すれば全画面に効く（🔵）。

### G-3. アイコンライブラリの体系が @mdi/js → lucide-react に総取っ替え（形状の一貫性差）
- **Vue版**: `plugins/icons.ts` に **Material Design Icons（@mdi/js）を一元集約**（`ICONS.CALENDAR/ANALYTICS/PIGGY_BANK/COG/SHARE/BACKSPACE/PENCIL/TRASH...` 計40種）。全画面がこの単一定義を参照し、アイコンの太さ・字面が完全統一。
- **React版**: `lucide-react` を各所で個別 import（[bottom-nav.tsx](../nextjs/src/features/layout/components/bottom-nav.tsx) の `Calendar/BarChart3/PiggyBank/PlusSquare/Settings` 等、11ファイルで散在）。集約定義は無い。
- **差の要点**: MDI（塗り主体・丸み）と lucide（線画・角張り）で**アイコンの見た目の質感が全体的に変わる**。かつ React 側は集約されていないため、同じ意味のアイコンが箇所ごとにブレるリスク（G-1 の `Share2` 分裂が実例）。
- **対応方針メモ**: 「Vue の見た目を維持」なら lucide の中で MDI に字面が近いものを選ぶか、共通アイコン定義ファイル（旧 `icons.ts` 相当）を React 側にも1枚用意して集約する。

### G-4. 共通ローディング表現の質感差（全画面オーバーレイ → ボタン単位 disabled）
- ※ 既存リスト B-10 で「廃止」は言及済み。ここは**見た目の質感**の補足のみ。
- **Vue版**: `useLoadingStore` + `Loading.vue` の**全画面固定スピナー**（18ファイルが利用）。処理中は画面全体が覆われ「処理中」が明確。
- **React版**: 各ボタンの `isPending` による `disabled` 化のみ（スピナー無しの箇所が多い）。
- **差の要点**: 「今アプリが動いている」という全体フィードバックが弱くなり、特に後述 U-3（共有トグル）や保存操作で「押したのに無反応に見える」体感になりうる。設計変更として妥当だが、要所（トグル・保存）は最低限スピナー/楽観更新を足すと Vue の安心感に近づく。

### G-5. 日本語フォントの明示指定が無い
- **Vue版**: Vuetify 標準（Roboto 系＋OS 日本語フォント）。
- **React版**: `Geist` / `Geist_Mono`（**ラテン subset のみ**指定）を html に適用（[layout.tsx:8-16](../nextjs/src/app/layout.tsx)）。日本語は結局 OS フォントにフォールバックするため、英数字と日本語で字面が混在しうる。
- **差の要点**: 家計簿は数字と日本語ラベルが密。英字だけ Geist・日本語は OS 依存だと、金額（英数字）とラベル（日本語）でリズムがずれる。🔵 実機確認のうえ、日本語 Web フォント（例 Noto Sans JP）を当てるか要判断。

### G-6. トーストの位置・見た目の差（中央下ワイド → 左下）
- **Vue版**: `v-snackbar`（画面下・幅90%のワイドバー、`色付き`、「閉じる」ボタン付き）（[default.vue:63-68](../layouts/default.vue)）。
- **React版**: sonner の `Toaster position='bottom-left'`（左下の小さめトースト）（[layout.tsx:31](../nextjs/src/app/layout.tsx)）。
- **差の要点**: 通知の出現位置と幅が変わる。モバイルで下部中央のワイドバー（Vue）に慣れているなら位置が変わって見える。軽微だが「見た目維持」観点では position 調整で寄せられる。

---

## U. 🔴 ユーザーが特に気にしている操作系（優先）

### U-1. 金額の電卓（テンキー）入力が完全廃止 → 素の1行テキスト入力 ★最優先 ✔ 解消（共通 PriceKeypad）
- ※ 既存リスト B-4 は「存在の言及のみ」。ここは**視覚・操作性の詳細**を深掘り（重複ではなく補完）。
- **Vue版の見た目・操作**: [NotePrice.vue](../components/NotePrice.vue)
  - 上部に**金額の大型表示帯**（outlined・右寄せ・大フォント `$fontsize-large`・`suffix=" 円"`・`toLocaleString()` で桁区切り・入力があれば右端に**×クリア**ボタン）。
  - その下に**電卓式テンキーを 3×3 ＋ 最下段(00 / 0 / ⌫) の4行グリッド**。全ボタンが `size="x-large" block`（幅いっぱい・特大）。並びは電卓通り（上段7-8-9…下段1-2-3、最下段 00・0・⌫）。⌫ は `mdiBackspaceOutline` アイコン。
  - **上限抑止**を押下ロジックに内蔵（`model*10+num < MAX_PRICE` のときだけ加算、`00`は`*100`、⌫は`Math.floor(model/10)`）。
- **React版の見た目・操作**: [note-record-form.tsx:229-236,478-505](../nextjs/src/features/record/components/note-record-form.tsx)
  - テンキーは**存在しない**（`nextjs/src` 全体 grep で keypad/pushPrice/BACKSPACE 相当ゼロ）。
  - 金額は「メモ」と同じ `TextInputRow`＝**ただの1行 `&lt;Input inputMode='numeric'&gt;`**。桁区切り表示なし・「円」サフィックスなし・大フォントなし・×クリアなし・上限抑止 UI なし（検証は zod の `priceSchema` 側）。
- **差の要点**: 1タップ＝1桁で見ないで打てる大型テンキー → OS 標準ソフトキーボード依存の小さな1行入力へ。**スマホでのタップ操作性・打鍵面積・金額の視認性（大フォント/桁区切り/円）・ワンタップ全消去がすべて後退**。家計簿の最頻操作（金額入力）の質的劣化で、体感 UX への影響が最も大きい。
- **波及**: 記録(note)だけでなく**定期record・ショートアップ・口座残高など金額を持つ全入力**が同じテキスト入力に（定期は U-2 参照）。電卓を共通コンポーネント化すれば全所に一括適用可能。
- **対応方針メモ**: `&lt;PriceKeypad /&gt;`（電卓 UI ＋ 大型金額表示＋⌫/×＋上限）を1つ作り、record/planned-record/short-cut/bank-balance のフォームに差し込む。上限は機能差分リスト A-6（MAX_PRICE）と連動。

### U-2. 定期record設定：一覧の情報密度低下・新規導線の移設・電卓喪失
- ※ 既存リストは「Cron 実体化タイミング」中心。ここは**設定画面の UI 見た目**（未記載領域）。
- **配置**: 両版とも設定「家計管理」タブ内の口座の下にセクション配置（専用タブではない）。Vue は見出しに `UPDATE` アイコン、React は**テキスト見出しのみ（アイコン欠落）**（[KakeiPlannedRecord.vue:3-5](../components/setting/KakeiPlannedRecord.vue) / [planned-record-setting-tab.tsx:36-47](../nextjs/src/features/planned-record/components/planned-record-setting-tab.tsx)）。
- **一覧の見た目**:
  - Vue: 左カラムに開始月区分名＋並べ替え矢印、右に**リッチな横長 RecordCard**（種別色28pxアバター＋共有アイコン、種別＞サブ、定期(UPDATE)アイコン、鉛筆編集、下段3分割＝方法名(色/立替者)/メモ(境界線)/金額(大・収入青字・円)）。
  - React: shadcn `Card` 1行に圧縮。**20px 色ドット＋「開始月区分・種別＞サブ」1行テキスト＋小さい `memo 金額`（符号±・円なし・青字なし）**。**方法名・方法色・立替者名・共有アイコン・定期アイコンが一覧から省略**（型には `methodName` 等があるのに未表示）（[planned-record-setting-tab.tsx:67-115](../nextjs/src/features/planned-record/components/planned-record-setting-tab.tsx)）。
- **並べ替え UI**: Vue は**編集(鉛筆)と並べ替え(↓)を常時同時表示**。React は**「並べ替え/編集」モードトグル方式**（同時に出ない・矢印位置が左→右）（[swap-button.tsx](../nextjs/src/components/form/swap-button.tsx)）。
- **新規登録導線（大きな差）**: Vue は「設定の**＋ボタン** → note(定期モード)」の一本道。React は **note 画面に「記録／定期」2タブを新設**して直接登録でき、設定タブ側の**＋新規ボタンは無い**（一覧からの編集リンクのみ）（[note/page.tsx:66-88](../nextjs/src/app/(private)/note/page.tsx)）。→ 発見性は向上したが、Vue の導線に慣れていると「設定から新規が作れない」と迷う可能性。🔵 どちらの導線に寄せるか要判断。
- **金額入力**: U-1 同様、Vue の電卓 → React のテキスト入力に後退。
- **差の要点**: 一覧が「一目で方法・金額・共有が分かる家計簿カード」から「1行テキスト」に平坦化。優先は ①一覧の情報復元（方法名/共有・定期アイコン/円/色） ②電卓（U-1と共通）。

### U-3. 共有トグルが「毎回サーバ往復で全画面 fetch」＝登録を急ぐ場面で待たされる ★体感UXの核心
- **Vue版**: トグルは `computed` setter → `setIsPair(val)`（Pinia の `ref` 更新＋localStorage 永続化）**のみ**。**fetch はゼロ・即時反映**。各画面が `isPair` を watch してクライアント側で出し分け（[default.vue:170-178](../layouts/default.vue) / composables の usePairStore）。トグル操作そのものは**待ち時間なし**。
- **React版**: トグル → `startTransition(setPairModeAction)` → Server Action が Cookie 更新＋**`revalidatePath('/', 'layout')` で全画面を再検証＝全レーン再fetch**（[pair-mode-switch.tsx:34-41](../nextjs/src/features/layout/components/pair-mode-switch.tsx) / [pair-mode-actions.ts:10-13](../nextjs/src/features/layout/actions/pair-mode-actions.ts) / [mode.ts:31-39](../nextjs/src/lib/server/pair/mode.ts)）。
  - **待ち時間中のUI**: `isPending` を `Switch` の `disabled` に渡すのみ。**スピナー無し・楽観的更新(`useOptimistic`)無し**。`checked={isPair}`（サーバ確定値）のため、押しても**再fetch完了までつまみが動かず、操作不能でグレーアウトして待つ**。
- **差の要点**: ユーザー懸念そのままの実態。Vue は「トグル＝即時」だったのが、React は「トグル＝サーバ往復＋全画面再fetch＋その間 disabled、視覚フィードバックはグレーアウトのみ」。**note/plan の登録前に共有を切り替えたいとき、毎回ネットワーク往復ぶん待たされる**。設計（再fetch方式）は [mode.ts](../nextjs/src/lib/server/pair/mode.ts) のコメントに意図として明記されているが、体感は確実に重い。
- **対応方針メモ（軽重2案）**:
  - 軽: `useOptimistic` でトグルのつまみを**先行反映**（見た目だけ即時）＋ 必要なら小スピナー。「押した感」を取り戻す最小対応。
  - 重: `revalidatePath('/', 'layout')`（全レイアウト）を、**実際にスコープが変わる画面ルートだけの再検証**に絞る。または登録フォーム系では「共有かどうか」をトグルでなく**フォーム内の選択**に寄せ、画面全体の再fetchを介さず登録できるようにする（登録を急ぐ動線と全画面再fetchを分離）。

### U-4. カレンダー画面：FullCalendar のカスタム CSS 未移植で「素の FullCalendar」化 ★見た目が別物 ✔ 解消（globals.css 移植＋ヘッダー一本化）
- ※ 既存リスト A-2/B-3/B-5/B-6/B-11 とは別軸（機能でなく**カレンダーの視覚アイデンティティ**）。
- **Vue版**: `&lt;style scoped&gt;` の `:deep()` で FullCalendar を大幅上書き（[calendar.vue:577-647](../pages/calendar.vue)）。
  - **今日セルを黄色 `#ffff00`**、**日曜=赤 / 土曜=青の曜日色**（ヘッダ・本文両方）、列ヘッダ `0.6rem`・日付数字 `0.8rem/550` の**小フォント**、日別収支ラベルは枠なし背景なしのプレーンテキスト、`day-events` の余白を詰める（`margin-bottom:0.3rem`）＝**コンパクトで詰まった家計簿カレンダー**。
  - 標準ツールバーは `display:none` で消し、月移動＋年月＋収支は自作 `PaginationBar`（中央年月＋左右矢印）に一本化。
- **React版**: FullCalendar の上書き CSS が**一切無い**（grep で `fc-*` ゼロ）（[month-calendar.tsx:92-137](../nextjs/src/features/calendar/components/month-calendar.tsx)）。
  - 今日は**デフォルトの淡い水色**、**曜日の赤青色分けなし**、フォントは**デフォルトサイズ**。
  - 日別収支ラベルは `display:'list-item'`＋`classNames:['calendar-day-sum']` 指定だが **`calendar-day-sum` の CSS が未定義**（globals.css に無し）→ **箇条書きの黒点(•)付き・デフォルトサイズ**で表示され、Vue の詰まった小金額テキストと大きく異なる。
  - **標準ツールバーを表示**（左 title・右 prev/next）した上で、さらに独自 `&lt;header&gt;` で「カレンダー」見出し＋月収支を描画 → **年月がツールバー title と画面ヘッダーの2箇所に重複**、タイトル左寄せ・移動ボタン右寄せで Vue の左右対称と配置バランスも別物。
- **差の要点**: カレンダーの identity（黄色い今日・赤青の曜日・小フォント・詰め余白・年月の中央一本化）が**丸ごと消え、素の FullCalendar** に。ユーザーの「カレンダー画面が全然違う」はこれが主因。
- **対応方針メモ**: ①FullCalendar 用のグローバル CSS（`fc-*` 上書き）を1枚用意し、Vue の `:deep()` 相当（今日=黄・曜日=赤青・小フォント・余白詰め）を移植。②`calendar-day-sum` の CSS を定義して黒点除去＋小サイズ化。③標準ツールバーを消して独自ヘッダー/PaginationBar に一本化し年月重複を解消。

---

## C. 🟡🔵 その他の画面別・見た目差分（カレンダー詳細＋各画面）

### C-1. カレンダー：選択日 record カードが2段リッチカード → 1行簡素リスト
- **Vue**: 1件を outlined `v-card` の2段組（上段=種別色アバター＋種別/サブ＋予定アイコン＋鉛筆、下段=方法＋相手名 / メモ(境界線) / 右寄せ大金額＋円、受取は青字）（[RecordCard.vue](../components/RecordCard.vue)）。
- **React**: 1件を `&lt;li&gt;` の1行フレックス（小色ドット＋「種別/サブ · 方法 · 相手名」中黒連結＋メモ(muted)＋金額）。**アバター・編集・予定アイコン・共有アイコン・境界線・円・青字受取なし**、自分以外は `opacity-60`（[day-record-list.tsx:33-64](../nextjs/src/features/calendar/components/day-record-list.tsx)）。
- **要点**: 家計簿らしい情報密度・金額強調が失われ一覧性が低下。

### C-2. カレンダー：下部アクション群がピル型ツールバー → プレーンボタン2個＋常時展開セクション
- **Vue**: グリッド直下に横一列のアクションバー（全記録トグル chevron / TODO ピル / 「記録＋」＋ショートカット矢印の**結合ピル**(primary) / 「予定＋」ピル）を凝縮配置。TODO はチップ群、ショートカットは**2カラムの色帯付きカード**（[calendar.vue:22-138](../pages/calendar.vue) / [RecordCardHalf.vue](../components/RecordCardHalf.vue)）。
- **React**: 「記録＋」「予定＋」の Link 2個を `flex gap-2` で並べるのみ。TODO は**常時表示フォーム＋1カラム縦リスト**、ショートカットは**1カラム縦リスト（色帯なし・「追加」ボタン経由）**（[calendar-screen.tsx:71-95](../nextjs/src/features/calendar/components/calendar-screen.tsx) / [shortcut-list.tsx](../nextjs/src/features/calendar/components/shortcut-list.tsx) / [memo-list.tsx](../nextjs/src/features/memo-shortcut/components/memo-list.tsx)）。
- **要点**: コンパクトな操作ツールバー＋トグル展開 → 縦長の常時展開に。丸ピル/primary塗り/2列カードの視覚統一感が失われ画面が縦に伸びる。

### C-3. カレンダー：選択日見出しが日本語整形 → ISO文字列
- **Vue**: `dateLabel`（日本語日付ラベル）を見出しに。**React**: 生の `YYYY-MM-DD`（`dateStr`）を見出しに（[day-record-list.tsx:76-84](../nextjs/src/features/calendar/components/day-record-list.tsx)）。カジュアルさ・日本語 UI としての自然さが低下。祝日は React が赤ピルバッジ（Vue はセル日付の赤字＝B-11）で表現場所が異なる。

### C-4. summary：セグメントトグル・色付き数字などの Vuetify 質感の平坦化 → 第2弾 I 群で確定
- **確定結果**（第1弾では要確認だったが第2弾で精査済み）: セグメント連結トグルは個別ボタン化、タブのアイコンは全消失、スワイプは喪失（**I-4/I-6**）。一方**収支テーブルの青/赤色分けは維持されている**（後退なし。[summary-bar.tsx:203-211](../nextjs/src/features/summary/components/summary-bar.tsx)）。
- **詳細は I-1〜I-6 を参照**（円グラフ凡例喪失・Y軸目盛り喪失・チップUI・タブ/期間バー・精算ステッパー・スワイプ）。

### C-5. note：収支トグル・種別サマリ・方法選択の質感差
- **収支トグル**: Vue `v-btn-toggle`（連結セグメント）→ React 独立2ボタン（default/outline）。連結感喪失。
- **種別アバター**: 60px → 48px（`size-12`）に縮小、カテゴリ名 `text-xs` 固定。
- **種別確定後**: Vue「readonly テキストフィールド＋×アイコン」→ React「下線テキスト＋（選び直す）文言」。リセットの発見性がアイコン→文言に変化。
- **方法選択**: Vue `v-select`（クレカ prepend アイコン付き・underlined）→ React ネイティブ `&lt;select&gt;`（アイコンなし・角丸ボーダー）。
- **立替チェック**: Vue `v-checkbox` → React 素の HTML `&lt;input type=checkbox&gt;`（[note-record-form.tsx](../nextjs/src/features/record/components/note-record-form.tsx)）。
- **要点**: 個々は軽微だが、積み重なると「作り込まれた入力画面」→「素のフォーム」の印象差になる。

### C-6. リマインダー通知ベル：大きな MDI ベル → 小さめ lucide ベル・配置変更
- **Vue**: `AppBarNotification` は `v-btn`(icon)内に大きい MDI ベル(`size=x-large`)＋赤 `v-badge`。クリックで `v-dialog`「お知らせ」（[AppBarNotification.vue](../components/AppBarNotification.vue)）。
- **React**: `(private)/layout.tsx` の sticky トップバー左端に lucide `Bell size-5`（控えめ）＋小バッジ。shadcn `Dialog`（[reminder-bell.tsx](../nextjs/src/features/layout/components/reminder-bell.tsx) / [(private)/layout.tsx:33-43](../nextjs/src/app/(private)/layout.tsx)）。
- **要点**: ベルが小型化・配置が sticky バー左端に固定。機能同等だが存在感が下がる（見落としやすさ）。

---

# ── 第2弾：追加深掘り調査（bank / plan / records / summaryグラフ / login / setting / ダイアログ / インタラクション）──

> 2026-09-22 追記。第1弾（G/U/C）で手薄だった画面・横断観点を再ファンアウトして精査した結果。**第1弾で判明した「色表現が色ドット化」「アイコン→テキストラベル化」「Vuetify→素のフォーム化」が全画面で一貫していること**が裏付けられ、加えて **summaryグラフの装飾喪失・ダイアログ質感・削除確認・スワイプ喪失** など新規差分が判明した。

## H. 🔴🟡 アプリ横断の一貫した退化パターン（第2弾で確証）

### H-1. 色の視覚表現が全画面で「文字色/大アバター」→「小さな色丸ドット」に一律変化 ★横断
- **Vue版**: 色の伝え方が箇所により作り分けられていた。①種別＝30px の `v-avatar`（色付き丸、ペア時は中に SHARE アイコン）②方法・口座名＝**名前テキスト自体に色**（`text-${colorName}`）③予定種別＝**四角い色ブロックボタン**（rounded=0＋SHARE 内包）。
- **React版**: ほぼ全所が **`size-3〜5` の `rounded-full` 単色丸ドット**に統一（note 種別 / records 明細 / calendar 日別 / bank 口座カード / plan カテゴリ / 設定の種別・予定種別・リマインダー / summary 内訳一覧）。方法名だけは Vue 踏襲で文字色（[kakei-method.tsx:118](../nextjs/src/features/type-method/components/kakei-method.tsx)）。
- **差の要点**: 「色付きアバター（アイコン内包可）」「四角い色ブロック」「文字色」という**表現の多様さが、小さな色丸1種に平坦化**。共有(SHARE)アイコンを色マーカー内に出す演出（G-1）もこの過程で消えた。色そのものは対象外だが、**マーカーのサイズ・形状・アイコン内包という情報設計**が全画面で後退している。
- **対応方針メモ**: G-1 の共通 `ShareBadge` と統合し、「色＋共有状態＋（種別により四角/丸）」を1コンポーネントで表現して全画面に配れば、Vue の作り分けを復元しつつ統一もできる。

### H-2. 行内の操作ボタンが「アイコン（鉛筆/ゴミ箱/矢印）」→「テキストボタン」に一律変化 ★横断
- **Vue版**: 編集＝鉛筆アイコン(`PENCIL`)、削除＝ゴミ箱アイコン(`TRASH`)、並べ替え＝矢印アイコン(`ARROW_DOWN`/`ARROW_RIGHT`)を**アイコンボタン**で。行が短くコンパクト。
- **React版**: 編集＝「編集」文字、削除＝「削除」文字、並べ替え＝**文字グリフ `↓`/`→`**（`SwapButton` に文字を渡す）に変化（[kakei-type.tsx:156,165,188](../nextjs/src/features/type-method/components/kakei-type.tsx) / [swap-button.tsx](../nextjs/src/components/form/swap-button.tsx) / [reminder-tab.tsx:97-105](../nextjs/src/features/plan-reminder/components/reminder-tab.tsx) / bank/plan/note のフッター削除も同様）。
- **差の要点**: 意味は明確になるが、①行の情報密度が下がる（文字ぶん横幅を食う）②MDI アイコン→ただの矢印グリフでベクターアイコンの質感喪失 ③Vue にあった **2列レイアウト時の矢印方向の出し分け（行末=右、行頭=左下）が消え一律 `→`** になり並べ替え方向の視覚的整合が低下。
- **対応方針メモ**: G-3（アイコン集約）と一体で、lucide の `Pencil`/`Trash2`/`ArrowDown` を使ったアイコンボタンに戻すか、テキストのままでよいかをデザイン判断。

### H-3. 削除ボタンの配置が「行内/フッター横並び」→「全幅の赤ボタンを下に別置き」に一律変化
- **Vue版**: 削除はフッターで登録ボタンと**同じ行に横並び**（左＝赤ゴミ箱アイコン、右＝登録）、またはダイアログ `v-card-actions` 内で `justify-space-between`。
- **React版**: 保存は `DialogFooter`（右寄せ）、**削除は Footer の外側に別 `<form>` として全幅 `variant='destructive'` の赤テキストボタンを最下部に縦積み**（note / plan / bank-form / type/method/sub-type/plan-type ダイアログすべて同型。[type-dialog.tsx:88-99](../nextjs/src/features/type-method/components/type-dialog.tsx)）。
- **差の要点**: 削除の視覚的重み（全幅赤ボタン）が増し、Vue の「控えめなアイコン」より**誤タップ時の圧が強い／画面が縦に伸びる**。全画面で一貫しているので統一感はあるが、Vue のコンパクトさは失われる。

## I. 🟡 summary（集計）画面：グラフの装飾・操作要素の喪失

### I-1. 円グラフの凡例＋「凡例クリックでスライス表示切替」が完全消失 ★最大
- **Vue版**: Chart.js の `Legend` を登録し、円グラフ上部に凡例を表示。**凡例ラベルをクリックするとそのスライスの表示 ON/OFF が切り替わる**（Chart.js 標準）。カテゴリの色↔名前対応も凡例で分かる（[SummaryPie.vue:189,211-214](../components/SummaryPie.vue)）。
- **React版**: `SummaryPieChart` に凡例(`ChartLegend`)を**一切置いていない**。凡例そのものが無く、クリックでのスライス表示切替も不可。色↔名前対応はグラフ下の内訳リスト（色ドット）に依存（[summary-pie-chart.tsx:38-59](../nextjs/src/features/summary/components/summary-pie-chart.tsx)）。
- **差の要点**: 凡例とインタラクティブなフィルタリングが消え、円グラフの情報量・操作性が明確に後退。
- **対応方針メモ**: Recharts に凡例クリックのトグルは標準で無いため、`ChartLegend` の表示だけでも足す＋必要ならクリックで `hidden` state を持つ実装。

### I-2. 棒グラフの Y軸目盛り・軸線が消失（ツールチップ依存に）
- **Vue版**: Chart.js デフォルトで **X軸・Y軸（数値目盛り）両方＋内部グリッド線**を表示（[SummaryBar.vue:121,140-147](../components/SummaryBar.vue)）。
- **React版**: `CartesianGrid vertical={false}`（横グリッドのみ）、`XAxis` は `tickLine/axisLine=false`、**Y軸コンポーネント自体を置かず＝Y軸目盛り非表示**（[summary-bar.tsx:135-142](../nextjs/src/features/summary/components/summary-bar.tsx)）。
- **差の要点**: 数値の絶対量が軸から読み取れず、ホバー（＝モバイルでは出しにくい）ツールチップ頼み。棒の色も純青 `rgb(0,0,255)` → マテリアルブルー `#2196f3`＋角丸 `radius=2` に変化。

### I-3. カテゴリ別グラフ：種別チップが「横スクロール＋filterチェック」→「折り返し＋塗りのみ」
- **Vue版**: `v-chip-group` の filter チップ（**選択時にチェックマーク表示**、ブルーグレー塗り、多カテゴリは**横スクロール**）。凡例はグラフ**上**（[SummaryBarType.vue:12-64](../components/SummaryBarType.vue)）。
- **React版**: 自前の丸ピル `ChipButton`（active は primary 塗りのみ・**チェックマークなし**）、多カテゴリは**折り返し**。凡例はグラフ**下**（[summary-bar-type.tsx:105-125,173-184](../nextjs/src/features/summary/components/summary-bar-type.tsx)）。
- **差の要点**: 選択状態の明示（チェック）が消え、横スクロール→折り返しでカテゴリが多い時の見え方が大きく変わる。凡例位置も上→下へ移動。

### I-4. summary タブ・期間バーの装飾喪失（アイコン／ブルーグレー帯／中央ピッカー）
- **Vue版**: メイン3タブ＋推移内2タブすべて**アイコン付き**（内訳=円/推移=棒/精算=現金、全体=上下/カテゴリ別=図形）、`grow` 等幅＋ブルーグレー背景帯。期間は `PaginationBar`（白帯・高さ55px・**中央タップで年月ピッカー**）。
- **React版**: タブは**テキストのみ**（アイコン全消失）、shadcn 標準のニュートラルなセグメント。期間は `PeriodNav`（軽量 flex バー・**中央はタップ不可のテキスト**・矢印は outline 小ボタン）。加えて `<h1>集計</h1>` 見出しを新設（[summary-screen.tsx:43-62](../nextjs/src/features/summary/components/summary-screen.tsx) / [period-nav.tsx:23-52](../nextjs/src/features/summary/components/period-nav.tsx)）。
- **差の要点**: C-4 の確定版。タブのアイコン識別性・ブルーグレー帯・年月ダイレクトジャンプが失われる。※収支テーブルの**青/赤の色分けは維持**されている（[summary-bar.tsx:203-211](../nextjs/src/features/summary/components/summary-bar.tsx)）＝ここは後退なし。

### I-5. 精算タブ：3ステップのステッパー＋レート格子ダイアログが消失
- ※ レート按分の**機能**欠落は機能差分 A-7 で既知。ここは**見た目・操作フロー**の観点。
- **Vue版**: `v-stepper`（READY→GOING→DONE の**番号付きビジュアルステッパー**）で段階を可視化。対象 record はタップ→`SettlementSelectRateDialog`（10段階レートの格子 UI）→色ラベル/背景色でグルーピング表示、未処理は `v-badge dot`（[SummarySettlement.vue:12-137](../components/SummarySettlement.vue)）。方向（お渡し/受取）は**自動算出**。
- **React版**: ステッパー無し。1枚のパネルに**チェックボックスの平坦リスト**＋方法 Select＋金額 Input、方向は**手動トグル**（お渡し/受取）。2カラム（自分↔相手）→縦積み3グループ（[summary-settlement.tsx:108-223](../nextjs/src/features/summary/components/summary-settlement.tsx)）。
- **差の要点**: 段階感（開始→分類→確定）と、レート選択という視覚リッチな操作が失われ、事務的なチェックリストに。方向の自動算出→手動選択も操作増。

### I-6. summary 画面のスワイプ期間移動が消失（カレンダー以外の新規差分）
- **Vue版**: 円グラフ・棒グラフのルートに `v-touch`（左右スワイプ→期間移動）（[SummaryPie.vue:3](../components/SummaryPie.vue) / [SummaryBar.vue:3](../components/SummaryBar.vue)）。
- **React版**: スワイプ実装ゼロ。左右矢印ボタンのみ。
- **差の要点**: B-6（カレンダースワイプ）は既知だが、**集計画面のスワイプ喪失は新規**。タッチ主体のモバイル操作感が summary でも後退。

## J. 🟡 bank / plan / records 画面の個別差分

### J-1. bank 画面に口座管理（設定タブ）が同居し、画面が長くなった
- **Vue版**: bank 画面は「チャート＋履歴＋ボタン＋残高テーブル」の**残高閲覧専用**。口座の追加/編集は**設定画面側**（[bank.vue:1-62](../pages/bank.vue)）。
- **React版**: `bank-screen.tsx` が `<BankSettingTab>`（口座カードグリッド＋追加）を**残高テーブルの下に同居**（[bank-screen.tsx:51-53](../nextjs/src/features/bank/components/bank-screen.tsx)）。
- **差の要点**: 画面構成が根本的に変化（残高専用→残高＋口座管理の統合）。設定から辿る導線が変わり bank 画面が縦に長くなる。🔵 意図的統合か要確認。

### J-2. bank 残高推移グラフの見た目差（凡例追加・時間軸→カテゴリ軸・アスペクト固定）
- **Vue版 (Chart.js)**: **凡例なし**、X軸は `type:'time'` の時間軸（`YYYY/MM`）、ツールチップは `YYYY/MM/DD`、親高さに追従、`tension:0.2`・塗りあり（[bank.vue:119-135](../pages/bank.vue)）。
- **React版 (Recharts)**: **凡例を常設**、X軸はカテゴリ軸（`minTickGap`）、ツールチップは `〜万` 単位（**日付書式喪失**）、`aspect-video`（16:9固定）、`fillOpacity=0.3`・`strokeWidth=2`（[bank-balance-chart.tsx:39-74](../nextjs/src/features/bank/components/bank-balance-chart.tsx)）。空時は Vue が空グラフ枠を残す／React は `return null` でグラフごと消える。
- **差の要点**: 凡例有無・軸の性質・アスペクト比・ツールチップの日付精度が変わり、残高推移の読み取り感が変化。

### J-3. records 明細ヘッダのブルーグレー色帯・カテゴリ表示カードが消失
- **Vue版**: 上部に `bg-blue-grey-lighten-4 height-48px` の**色帯ヘッダ**、右に `outlined width=200` の**カテゴリ名カード**（色アバター＋共有アイコン）、「立替込み/除く」表示あり（[records.vue:4-53](../pages/records.vue)）。
- **React版**: 帯なし（背景色なし）ヘッダ、カテゴリは**小色丸(size-3)＋テキスト**のみ、カテゴリ名カード消失、「立替込み/除く」表示なし、見出しは muted 小字で別行（[records-screen.tsx:56-86](../nextjs/src/features/summary/components/records-screen.tsx)）。
- **差の要点**: records 画面の「今どの絞り込みを見ているか」の視覚的な手がかり（色帯・カード・立替込み表示）が弱くなる。

### J-4. login 画面：カード枠消失・パスワード表示トグル消失・再設定が常設インライン化
- **Vue版**: `v-card` の白カードにフォームを収め、パスワード欄に**目玉アイコン（表示/伏字トグル）**、エラーは `v-alert` でフォーム内インライン、パスワード再設定は**ボタンで切り替わる別モード**、デモ/とりせつは横並び2ボタン（[login.vue:5-99](../pages/login.vue)）。
- **React版**: カード枠なし（背景に直接フォーム・中央寄せ）、`type='password'` 固定で**目玉トグルなし**、エラーは**トースト**、パスワード再設定用メール欄は**常時同時表示**（モード切替なし）、デモは全幅1ボタン（[login-form.tsx:42-97](../nextjs/src/features/auth/components/login-form.tsx)）。
- **差の要点**: ①白カードの囲みが消え質感がフラットに ②**パスワード可視化トグルの欠落**（入力ミス確認ができない・実用的な後退）③再設定フォームが常に見えて画面がやや雑多に ④エラーがインライン常設→一時トーストで残存性低下。
- **対応方針メモ**: 目玉トグルは shadcn Input＋ボタンで容易に復活可（実用度高め）。

### J-5. plan / bank / login フォームの主ボタン文言・サイズの平坦化
- **Vue版**: 主ボタンは新規「登録」/編集「変更」を**出し分け**、`x-large`/幅広（cols=5・高さ44）の存在感。名前欄は underlined（下線のみ）。
- **React版**: 主ボタンは**常に「保存」**（新規/編集で不変）、shadcn 標準サイズ。入力は枠付き box＋ラベル追加。無効化はサーバ検証＋インライン赤字に（Vue はボタン `disabled` で事前抑止）（[plan-form.tsx:154-179](../nextjs/src/features/plan-reminder/components/plan-form.tsx)）。
- **差の要点**: ボタンの文言の文脈性（登録/変更）と特大サイズが失われ汎用フォーム化。エラー表現もトースト/事前抑止→インライン赤字に統一。

## K. 🟡 ダイアログ・フォームの質感差（Vuetify v-dialog → shadcn/base-ui Dialog）

### K-1. ダイアログの開閉アニメーション：Vue は無演出、React は演出付き ★体感差
- **Vue版**: 主要ダイアログは軒並み `:transition="false"` で**アニメーションを明示的に無効化**（パッと出てパッと消える）。日付/数値ピッカーの一部だけ `scale-transition`（[common/Dialog.vue:4](../components/setting/common/Dialog.vue) / [BankBalanceDialog.vue:4](../components/BankBalanceDialog.vue) 他）。
- **React版**: shadcn/base-ui ダイアログに**フェード＋95%ズーム**（`duration-100`）＋**オーバーレイに背景ブラー**（`backdrop-blur-xs`）が付く。Sheet は側面スライド（[dialog.tsx:33,55](../nextjs/src/components/ui/dialog.tsx) / [sheet.tsx:55](../nextjs/src/components/ui/sheet.tsx)）。
- **差の要点**: **開閉演出の方向が逆**。Vue は意図的に無演出、React は演出リッチ＋ブラー。これは「Vue の見た目維持」なら React 側の演出を抑える判断もありうる（🔵 好みの問題。演出はモダンだが Vue の即応感とは異なる）。

### K-2. 色選択 UI：6列固定＋「●」選択マーク → flex-wrap＋枠線選択
- **Vue版**: `v-col cols="2"`（**6列固定グリッド**）の色ボタン、選択中は中に**「●」文字**を表示（[common/Dialog.vue:23-40](../components/setting/common/Dialog.vue)）。
- **React版**: `flex flex-wrap gap-2` の**可変列**、`size-7 rounded-full` の完全な丸、選択は**濃い枠線**で表現（●なし）（[color-picker.tsx:30-52](../nextjs/src/components/form/color-picker.tsx)）。
- **差の要点**: レイアウト（6列固定→折り返し）と選択フィードバック（●→枠線）が根本的に変化。

### K-3. ダイアログ幅・ボタン配置・入力質感の差
- **Vue版**: `max-width=600` の広めダイアログ、主ボタン**中央 or 両端配置**、入力は underlined（下線）基調、行削除は**ゴミ箱アイコン**、行追加は**丸型 primary「＋」（中央下）＋ divider**。
- **React版**: `max-w-sm`(384px) と**細め**、主ボタンは `DialogFooter` **右寄せ**（背景色 `bg-muted/50`＋上ボーダー付き）、入力は枠付き box 基調、行削除は**「✕」文字**、行追加は**secondary 右寄せボタン（divider なし）**。右上に**×閉じるボタン**を新設（[bank-balance-dialog.tsx:63-182](../nextjs/src/features/bank/components/bank-balance-dialog.tsx) / [dialog.tsx:41-79](../nextjs/src/components/ui/dialog.tsx)）。
- **差の要点**: ダイアログ全体が「広め・中央ボタン・下線入力・アイコン操作」→「細め・右寄せボタン・枠入力・文字/✕操作」へ。K-1/K-2 と合わせ、ダイアログの体験が別物。

### K-4. リマインダーダイアログの入力コントロールが Vuetify リッチ → ネイティブ簡素
- **Vue版**: 直近日付は `v-menu + v-date-picker`（**カレンダーポップアップ**）、ヶ月後/月日は `v-btn-toggle` セグメント＋ `v-select`、メモは underlined＋**クリア(×)アイコン**（[PlanReminderDialog.vue:54-153](../components/setting/PlanReminderDialog.vue)）。
- **React版**: 日付は `type='date'`（**ネイティブ日付入力**）、条件切替は `RadioGroup`（セグメントでなくラジオ）、月/日は**素の `<select>`**、メモは素の Input（**クリアボタンなし**）（[reminder-dialog.tsx:112-202](../nextjs/src/features/plan-reminder/components/reminder-dialog.tsx)）。
- **差の要点**: カレンダーポップアップ→OS 依存の日付入力、セグメント→ラジオ、クリアボタン喪失。入力コントロールの質感が全体に簡素化。

## L. 🟡🔵 フィードバック・確認・空状態の差（インタラクション）

### L-1. 削除確認は両版とも「リマインダー系のみ」＝ React で AlertDialog 未活用
- **両版共通**: `window.confirm('削除してもよいですか？')` を出すのは**リマインダー由来 plan 削除**と**リマインダー削除**の2箇所のみ。家計簿 record・カレンダーメモ・種別/方法/口座は**確認なしで即削除**（Vue [calendar.vue:376](../pages/calendar.vue) / React [event-detail.tsx:117](../nextjs/src/features/calendar/components/event-detail.tsx),[reminder-tab.tsx:77](../nextjs/src/features/plan-reminder/components/reminder-tab.tsx)）。
- **差の要点**: 削除確認 UX は**移行で変わっていない（同等）**。ただし React には shadcn `AlertDialog` が**実装済みだが利用箇所ゼロ**（[alert-dialog.tsx](../nextjs/src/components/ui/alert-dialog.tsx) の import 0件）。**味気ないネイティブ `window.confirm` のまま**で、アニメ付きアプリ内ダイアログに置き換える改善余地がある（🔵 UX 改善の好機。record 等の即削除に確認を足すかもデザイン判断）。

### L-2. pending 中の視覚フィードバック：全画面オーバーレイ → 局所 opacity/disabled
- ※ G-4（ローディング質感）の具体形。
- **Vue版**: `useLoadingStore` の**全画面オーバーレイスピナー**＋ダイアログ保存ボタンの `:loading` スピナー。
- **React版**: `useTransition` の `isPending` で**局所フィードバック**。カレンダーは `data-[pending=true]:opacity-60` で**コンテンツ半透明化**、各ボタンは `disabled`（スピナーは多くの箇所で無し）（[calendar-screen.tsx:101](../nextjs/src/features/calendar/components/calendar-screen.tsx)）。
- **差の要点**: 「今処理中」の伝わり方が全画面→局所に。半透明化は控えめで、U-3（共有トグル）のように**スピナーなし disabled だけだと無反応に見える**箇所がある。要所は小スピナー追加を検討。

### L-3. 空状態（データ無し）の文言色・余白が muted 小字化
- **Vue版**: 「表示するデータがありません」「残高履歴を追加してください」等を**黒文字・中央・`mt-30px`** で表示。
- **React版**: 文言は概ね同一だが `text-muted-foreground text-sm py-8`（**淡いグレー・小フォント・上下余白**）に統一（bank/records/summary 各所）。React 側は BarType 等で**空状態を新設**した改善もある。
- **差の要点**: 空状態の視認性がやや下がる（淡色小字）が、統一感は向上。軽微。

### L-4. フォーム送信後の反応が「トースト種別駆動の自動クローズ」に標準化
- **Vue版**: 各画面で手続き的に「保存→`setToast`→`router.push` or 親でリスト再取得＋ダイアログ閉じ」を手書き。
- **React版**: `useFormAction`（結果→トースト自動発火）＋`useCloseOnSuccess`（**success トースト時のみダイアログ自動クローズ**、失敗時は開いたまま）に統一（[use-close-on-success.ts:13](../nextjs/src/components/form/use-close-on-success.ts)）。CRUD の多くは `redirect+setFlashToast` で遷移先トースト。
- **差の要点**: 挙動の質感は近いが、React は一貫化＋「失敗時はダイアログが残る」明確な仕様。これは**改善方向**（後退ではない）。参考情報として記載。

---

## D. 対応の優先度（UX 改善セッションの着手目安）

| 優先 | 項目 | 区分 | 一言 |
| :--- | :--- | :--- | :--- |
| **最優先** | U-1 金額の電卓入力の復活（共通 `PriceKeypad`） | 🔴 | 最頻操作の質的後退。全金額フォームに一括適用可 |
| **最優先** | U-4 カレンダー FullCalendar カスタム CSS 移植 | 🔴 | 「全然違う」の主因。今日=黄・曜日=赤青・小フォント・余白詰め・ツールバー一本化 |
| **高** | U-3 共有トグルの体感（useOptimistic ＋ 再fetch範囲の見直し） | 🔴 | 登録を急ぐ動線の待ち解消。まず楽観更新で「押した感」回復 |
| **高** | G-1 共有シグナルのアイコン統一（共通 `ShareBadge`） | 🔴 | 色ドット/文字/`Share2` の分裂を2人アイコンに一本化。データは揃済 |
| **中** | U-2 定期record一覧の情報復元＋新規導線の方針決め | 🔴🔵 | 方法名/共有・定期アイコン/円/色を一覧へ。＋導線をどちらに寄せるか判断 |
| **中** | C-1/C-2 カレンダー下部（recordカード・アクション群・ショートカット） | 🟡 | 情報密度と操作ツールバーの復元 |
| **中** | G-3/H-2 アイコン体系の集約＋行内アイコン復活（React 版 icons 定義） | 🟡 | lucide の字面選定＋集約で全体の一貫性回復。編集/削除/並替をアイコンに |
| **中** | H-1 色マーカーの表現復元（共通コンポーネント化） | 🟡 | 色ドット一律化を、種別=アバター/共有=アイコン内包 に戻す。G-1 と統合 |
| **中** | I-1 円グラフの凡例＋クリック表示切替の復活 | 🟡 | summary の情報量・操作性の後退。凡例追加＋任意でトグル |
| **中** | J-4 login のパスワード表示トグル復活 | 🟡 | 入力ミス確認の実用機能。shadcn Input＋ボタンで容易 |
| **中〜低** | I-5 精算タブのステッパー＋レート格子（機能差分 A-7 と一体） | 🟡🔵 | 機能(A-7)と見た目(ステッパー)を同時に。優先度は A-7 に従う |
| **低〜中** | G-2 背景パターン / G-5 日本語フォント / G-6 トースト位置 | 🟡🔵 | 地の質感。デザイン判断を伴う |
| **低〜中** | I-2〜I-4/I-6 summary グラフ装飾（Y軸/チップ/タブアイコン/スワイプ） | 🟡 | グラフのクロム復元。個別に取捨選択 |
| **低〜中** | J-1〜J-3/J-5 bank同居・グラフ軸・records色帯・ボタン文言 | 🟡🔵 | 画面別の構成・質感差 |
| **低〜中** | K-1〜K-4 ダイアログ質感（アニメ/色選択/幅/入力コントロール） | 🟡🔵 | Vuetify→shadcn の質感差。K-1 は逆に演出を抑える判断もあり |
| **低〜中** | L-1 削除確認を AlertDialog 化（改善の好機） | 🔵 | 未使用の AlertDialog を活用。record 即削除に確認を足すか判断 |
| **低** | C-3/C-5/C-6, G-4, H-3, L-2〜L-4 | 🟡🔵 | 各画面の Vuetify→shadcn 質感差。個別に取捨選択 |

---

## E. 調査メタ情報（別セッションでの再調査用）

- **調査手法（2波）**:
  - 第1弾（G/U/C 群）: 4観点を Explore で並行調査（①カレンダー ②note/金額入力 ③共有トグル/アイコン ④定期record）＋ 全体レイアウトをオーケストレータが直接精読。
  - 第2弾（H〜L 群）: 手薄領域を再ファンアウト（⑤bank/plan/records ⑥login/setting/inquiry ⑦横断インタラクション/モーション/確認 ⑧summaryグラフ/精算タブ）。summary の React 実ファイル名（summary-pie-chart.tsx 等）はオーケストレータが実在検証済み。
- **第1弾で要確認だった項目の確定**: C-4(summary) → I 群で確定（アイコン/スワイプ喪失・青赤色分けは維持）。
- **既存 [機能差分リスト.md](機能差分リスト.md) との関係**: 本リストは**見た目・UX 専用**。B-4(電卓)・B-7(共有アイコン)・B-10(ローディング)・B-11(祝日色)・A-7(精算レート)と一部トピックが重なるが、本リストは**視覚/操作性の詳細と統一観点**の深掘り。対応時は両リストを突き合わせること（例: U-1電卓↔A-6 MAX_PRICE、I-5精算ステッパー↔A-7 レート按分）。
- **横断パターン（第2弾で確証）**: 移行に伴い ①色マーカーが全画面で小色丸に一律化(H-1) ②行内操作がアイコン→テキスト化(H-2) ③削除が全幅赤ボタン下置きに(H-3) ④Vuetixy リッチ入力→ネイティブ/最小 shadcn 化(K群) が**一貫して**起きている。個別対応より**共通コンポーネント（ShareBadge/PriceKeypad/アイコン集約）で横断的に直す**のが効率的。
- **重要な設計上の事実**: G-1/H-1(共有・色マーカー)・U-2(定期一覧)・J-3(records色帯)・I-1(円グラフ凡例)・J-4(パスワード目玉) は **データ/コンポーネントが揃っており View 層のみで解消可能**（DB/サービス変更不要）。U-3(トグル)のみ再fetch設計に踏み込むため要設計判断。
- **改善方向の差分（後退ではない・参考）**: React で新設された空状態メッセージ(L-3)・送信後の自動クローズ標準化(L-4)・ダイアログ開閉アニメ(K-1)・数値の tabular-nums 桁揃え。「Vue 維持」方針では K-1 の演出を抑える判断もありうる。
- **未確認で 🔵 とした箇所**: J-1(bank同居の意図)・K-1(演出の是非)・L-1(削除確認をAlertDialog化するか)・G-2(背景復活)・G-5(日本語フォント)。実機（デモログイン→スクリーンショット、AGENTS.md の Playwright 手順）で確定させると精度が上がる。
