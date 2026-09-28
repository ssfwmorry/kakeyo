// メモ内 URL 自動リンクのための純粋ロジック。表示側 AutoLinkText がこの分割結果を <a>/テキストへ写す。
// http(s) の連続非空白を URL とみなす。

// `+`（1 文字以上）にして、スキームだけの `https://`（続きが無い）をリンク化しない。
// href が `https://` だけの空リンク <a> を作らない方が安全側。
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export type LinkSegment = { text: string; isUrl: boolean };

// split はキャプチャグループを結果に残すため [プレーン, URL, プレーン, ...] の交互配列になる。空文字は捨てる。
export function toLinkSegments(text: string): LinkSegment[] {
  return text
    .split(URL_PATTERN)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, isUrl: /^https?:\/\//.test(part) }));
}
