// メモ内 URL 自動リンクのための純粋ロジック（旧 utils/string.ts autoLink 移植）。
// React に触れない（Vitest 対象）。表示側 AutoLinkText がこの分割結果を <a>/テキストへ写す。
// 旧の正規表現 /(https?:\/\/[^\s]*)/g を踏襲し、http(s) の連続非空白を URL とみなす。

// 旧は `[^\s]*`（0 文字以上）だが、移植では `+`（1 文字以上）にして
// スキームだけの `https://`（続きが無い）をリンク化しない。実害はほぼ無い差だが、
// 空リンク（href が `https://` だけの <a>）を作らない方が安全側。
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export type LinkSegment = { text: string; isUrl: boolean };

// テキストを [プレーン, URL, プレーン, ...] のセグメント列へ分割する。
// split はキャプチャグループを結果に残すため交互配列になる。空文字は捨てる。
export function toLinkSegments(text: string): LinkSegment[] {
  return text
    .split(URL_PATTERN)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, isUrl: /^https?:\/\//.test(part) }));
}
