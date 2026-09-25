# 新デザイン適用計画

デザイン原典: https://claude.ai/artifact/2FanNbHvamWFqdHGu5kjkH （「かけよ デザイン再検討」）
作業ブランチ: `feat/nextjs-new-design`（`feat/nextjs` から分岐）

## 方針

UX が大きく変わるため、既存コンポーネントは書き換えず `nextjs/src/v2/` に並行実装する。
既存画面は最後まで動いたままにし、`/v2/*` で新画面を実機確認しながら段階移行する。

```
nextjs/src/
├── app/
│   ├── (private)/        ← 既存。移行完了まで触らない
│   └── v2/               ← 新デザインのルート
│       ├── layout.tsx
│       ├── calendar/ summary/ bank/ setting/ note/ ...
├── features/             ← 既存。server 層（actions/services/repositories）は再利用する
├── components/           ← 既存 shadcn。触らない
└── v2/                   ← 新デザインの FE 層
    ├── styles/tokens.css ← 色・ダークの定義（v2 スコープ）
    ├── components/ui/    ← 新デザインに寄せた shadcn 部品
    ├── components/       ← 画面共通部品（リストセル・セグメント・シート等）
    └── features/         ← 画面ごとの UI（Client 中心）
```

### 再利用と再実装の線引き

| 層 | 扱い |
|---|---|
| Prisma / repositories / services | 再利用（変更なし） |
| server actions / zod schemas | 原則再利用。UX 変更で入力項目が変わる画面のみ v2 側に追加 |
| domain（純ロジック・テスト付き） | 再利用 |
| components/ui（shadcn） | v2 に別途持つ（角丸・高さ・色が全面的に違うため） |
| 画面 UI（*-screen, *-tab, *-form） | 全面的に作り直し |

### トークンの扱い

`globals.css` の `:root` / `.dark` は触らず、`src/v2/styles/tokens.css` に `.v2-root` スコープで
定義する。既存画面の見た目は一切変えない。全画面の移行が終わった時点で `globals.css` へ昇格し、
`.v2-root` を外す（タスク 13）。

## 新デザインの骨子（デザイン基礎 Main.dc.html より）

- 地 `#F4F5F4` / 面 `#FFFFFF` / 文字 `#16191A` / 補足 `#5F6668` / 線 `#E3E6E6`、アクセント 1 色（既定 `#0A7481`）
- 影は使わず、地 → 面 → 面（弱）の明度差で重なりを表す
- 角丸: アイコン面 8 / ボタン 12 / カード 14〜16 / シート 20 / チップ 999
- 余白は 4 の倍数、画面左右 16、タップ領域 44 以上
- 独自トークン: `--saturday` `--bar`（すりガラス） `--overlay`
- Dialog は全て下から出るシート（Drawer / Sheet side="bottom"）に置き換える
- 中央の ＋ は「入力」を全画面モーダルで開く
- 設定はタブをやめ、グループ化リスト → 詳細画面へ進む
- 「個人｜共有」は全画面同じ部品・同じ右上位置。編集中は固定

## タスク一覧

依存の浅い順。各タスクは 1 コミット〜数コミット想定。

### 基盤

- [x] **T1. v2 ディレクトリとトークン基盤**
  `src/v2/styles/tokens.css`（ライト/ダーク、独自トークン含む）、`src/app/v2/layout.tsx`、
  `globals.css` から tokens.css を import。`next-themes` は既存を流用。
  併せて `features/master/color.ts` の `COLOR_HEX` をライト用・ダーク用の 2 組に差し替える
  （デザイン基礎「カテゴリ色の扱い：案A」の対応表のとおり。DB の色名は変えない）。

- [x] **T2. v2 共通部品**
  Button（4 種）、BottomSheet（下から）、Segment、PairModeSegment、
  ListCell（Link / Button / Static）、SectionList、NameCell、InitialCircle、
  ScreenHeader、ScreenTitle、AddRow / AddRowLink、TabBar、ThemeToggle、
  TextField、ColorGrid、SheetActionBar、SheetDeleteButton。
  RadioGroup / Select は設定画面では出番がなかったので作っていない（入力フローで必要になる）。

- [~] **T3. アプリシェル**
  済: すりガラスのタブバー（カレンダー / 集計 / ＋ / 口座 / 設定）、`env(safe-area-inset-*)`、
  ダーク切替ボタン（ライト中は月、ダーク中は太陽）、個人｜共有セグメントの右上固定配置、
  ThemeProvider（`next-themes`、初期値は端末設定）。
  残: manifest の `theme_color`（`#000000` のまま）。旧画面にも効くので T14 で地の色へ。

### 画面（浅い順）

- [x] **T4. 設定トップ**（`Setting.dc.html`）
  タブ廃止。家計管理 / 予定管理 / その他の 3 グループのリスト。各行は色タイル付きアイコン + 件数 + 右シェブロン。
  **最も単純なため先行実装済み。**

- [x] **T5. 設定 › リマインダー**（`SetReminder.dc.html`）
  期日超過 / これから の 2 グループ、丸タップで消化（打ち消し線）。
  追加フォームはこの計画では作らない。リマインダー自体の UX を別途見直すため、
  それが決まるまで「リマインダーを追加」は旧 /setting へ送る。

- [x] **T6. 設定 › 定期の記録**（`SetPlanned.dc.html`）
  毎月の収入 / 支出のサマリー 2 枚 + 日付つきリスト + 追加行。
  並べ替えはデザインに無いので持たせていない。
  追加・編集は旧 /note（入力フロー）へ送る。保存すると旧 /setting に着地する
  （リダイレクト先が固定のため）。入力フローの作り直し（T12・T13）で解消する。

- [x] **T7. 設定 › 方法**（`SetMethod.dc.html`）
  支払 / 受取 / 精算のセグメント、行タップで編集シート（名前・色・削除）、
  「編集」で並べ替え。精算は共有モードのみ。

- [x] **T8. 設定 › カテゴリ一覧・編集**（`SetType.dc.html` / `SetTypeEdit.dc.html`）
  支出 / 収入セグメント、「編集」で並べ替え、編集画面でサブカテゴリの
  追加・改名・削除・並べ替え。新規追加も同じ画面。
  併せて予定カテゴリ（設定トップから）も同じ形で作った。

- [x] **T9. 口座**（`Bank.dc.html`）
  総資産 + 総資産 1 本の推移グラフ + 口座別残高 + 残高登録シート。
  口座そのものの追加・編集はデザインに無いため作っていない（旧設定画面のまま）。

- [ ] **T10. 集計**（`Summary.dc.html`）— この計画では作らない
  デザインが確定しているのは内訳タブだけで、推移・精算の中身は描かれていない
  （精算は既存 492 行と重い）。デザインが揃ってから着手する。

- [x] **T11. カレンダー（ホーム）**（`Calendar.dc.html`）
  FullCalendar をやめて自前グリッドにした。セルが「日付・収支・予定の帯」の 3 段で、
  帯が複数日にまたがるため、ライブラリのレイアウトに載せるより素直だった。
  段の割り当ては `v2/features/calendar/domain/event-lanes.ts`（テストあり）。
  土日祝の色、月移動、日別リスト（予定・リマインダー・記録）まで実装済み。
  未実装: TODO の追加、ショートカット記録（どちらも旧画面が持つ機能で、
  新デザインには追加の導線が描かれていない）。

- [ ] **T12. 入力フロー**（`NoteType` → `NoteSub` → `Note` / `NoteIncome` / `NotePair` / `NoteTypePair`）
  全画面モーダル。カテゴリ選択 → サブカテゴリシート → 金額と詳細。
  共有モードは立替・メモ必須。**最も重く、UX 変更が大きい。**

- [ ] **T13. 予定・記録の編集**（`PlanAdd` / `PlanEdit` / `RecordEdit`）
  予定追加ドロワー、期間指定・共有、記録編集（入力② と同じ画面 + 削除）。

### 仕上げ

- [ ] **T14. ルート差し替えとクリーンアップ**
  `/v2/*` を `(private)/*` へ昇格、旧 UI 削除、`tokens.css` を `globals.css` へ統合し
  `.v2-root` スコープを外す、旧 features の UI 層を削除。

## 移行中の既知の段差

- **v2 → 旧画面への着地**: 定期の記録の追加・編集は旧 /note へ送り、保存すると
  旧 /setting に戻る。`redirect(SETTING_PATH)` が固定のため。T12・T13 で入力フローを
  作り直すまで残る。
- **再検証の二重打ち**: 設定・口座まわりの更新は旧パスと v2 パスの両方を再検証する。
  T14 で旧パスを消すまでの負債。
- **口座マスタの編集が v2 に無い**: 設定配下のデザインに口座の追加・編集画面が無いため、
  /v2/bank は残高の閲覧と登録だけを持つ。口座の増減は旧 /setting から行う。
- **並べ替えはドラッグでない**: デザインはドラッグハンドルだが、実装は既存の
  swap（下と入れ替え）を流用している。
- **カレンダーの TODO 追加・ショートカット記録が無い**: 旧画面は持つが、新デザインに
  追加の導線が描かれていない（TODO は「＋ 追加」のチップだけが見える）。
  どちらも旧 /calendar から操作できる。

## 未決事項

- カレンダーを FullCalendar のまま新デザインに寄せるか、自前グリッドにするか（T11 着手時に判断）
- カテゴリ色の近似色問題（yellow/amber/lime、blue/light-blue、green/light-green）。
  気になる場合はデザイン基礎の「案B（色の統合・データ移行あり）」を検討
- `yellow` は精算の表示専用とし、色選択の候補から外すか
