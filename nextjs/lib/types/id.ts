// 全ドメイン共通の ID 型（凍結資産）。PK は連番 int を維持し UUID 化しない。
// records / short_cuts の PK は DB 上 BigInt だが、JS number の安全整数範囲に
// 収まる運用のためアプリ層では一律 number として扱う。

export type Id = number;
