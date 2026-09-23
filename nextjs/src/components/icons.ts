// アプリ共通のアイコン定義。
//
// lucide-react を各所で個別 import すると、同じ意味に別アイコンが当たる事故
// （共有を Share2 / 色ドット / 文字で三分裂）が起きるため、ここを唯一の正とする。
// 新しくアイコンが要るときは lucide を直 import せずここに足す。
//
// 1 つのオブジェクトに束ねると `Icons.X` がプロパティ参照になり静的解析で
// 個別 export へ還元できず、1 個しか使わない画面（login 等）にも全アイコンが
// 載る。tree-shaking を効かせるため名前付き re-export にする。
// 行末コメントの MDI 名は、同じ意味のアイコンを探すときの手がかり。
export {
  ArrowDown as IconArrowDown, // mdiArrowDown
  ArrowRight as IconArrowRight, // mdiArrowRight
  Bell as IconBell, // mdiBell
  Calendar as IconCalendar, // mdiCalendar
  ChartColumn as IconChartBar, // mdiChartBar
  ChartPie as IconChartPie, // mdiChartPie
  Check as IconCheck, // mdiCheck
  // 「戻る」導線に使う。
  ChevronLeft as IconChevronLeft,
  Delete as IconBackspace, // mdiBackspaceOutline
  Eye as IconEye, // mdiEye
  EyeOff as IconEyeOff, // mdiEyeOff
  Pencil as IconPencil, // mdiPencil
  PiggyBank as IconPiggyBank, // mdiPiggyBank
  PlusSquare as IconPlusBox, // mdiPlusBox
  Repeat as IconUpdate, // mdiUpdate（定期）
  Settings as IconCog, // mdiCog
  Shapes as IconShape, // mdiShape
  SquareArrowOutUpRight as IconOpenInNew, // mdiOpenInNew
  Trash2 as IconTrash, // mdiTrashCanOutline
  TrendingUp as IconAnalytics, // mdiGoogleAnalytics
  // 共有(ペア)の唯一の正。2 人アイコンを使う
  // （lucide の Share2 は共有ノード図で意図が異なる）。
  Users as IconShare, // mdiAccountMultiple
  Wallet as IconCash, // mdiCashMultiple
  X as IconClose // mdiClose
} from 'lucide-react';
