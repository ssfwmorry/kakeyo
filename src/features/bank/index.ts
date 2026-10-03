// bank feature の公開 API（barrel）。公開するのは FE 型のみ。
// server-only（services / repositories / actions）は re-export しない。画面部品は
// components/ を、データは server/services を、actions は Client Component が直接 import する。
// 口座マスタの管理 UI は設定画面（/setting）専用で、bank 画面には置かない。

export type { BankItem, BankScreenData, TableRow } from './types';
