import { describe, expect, it } from 'vitest';
import { toLinkSegments } from './auto-link';

describe('toLinkSegments', () => {
  it('URL を含まないテキストは 1 つのプレーンセグメントになる', () => {
    expect(toLinkSegments('ただのメモ')).toEqual([
      { text: 'ただのメモ', isUrl: false }
    ]);
  });

  it('空文字は空配列になる', () => {
    expect(toLinkSegments('')).toEqual([]);
  });

  it('URL 単体は URL セグメント 1 つになる', () => {
    expect(toLinkSegments('https://example.com')).toEqual([
      { text: 'https://example.com', isUrl: true }
    ]);
  });

  it('前後にテキストを持つ URL を交互に分割する', () => {
    expect(toLinkSegments('参考 https://example.com を見て')).toEqual([
      { text: '参考 ', isUrl: false },
      { text: 'https://example.com', isUrl: true },
      { text: ' を見て', isUrl: false }
    ]);
  });

  it('複数 URL をそれぞれリンク化する', () => {
    const segments = toLinkSegments('a http://x.test b https://y.test c');
    expect(segments.filter((s) => s.isUrl).map((s) => s.text)).toEqual([
      'http://x.test',
      'https://y.test'
    ]);
  });

  it('http と https の両方を URL とみなす', () => {
    expect(toLinkSegments('http://a.test')[0]?.isUrl).toBe(true);
    expect(toLinkSegments('https://a.test')[0]?.isUrl).toBe(true);
  });

  it('ftp など http(s) 以外はリンク化しない', () => {
    expect(toLinkSegments('ftp://a.test')).toEqual([
      { text: 'ftp://a.test', isUrl: false }
    ]);
  });

  it('URL は空白までを 1 つのリンクとして貪欲に取り込む', () => {
    // /(https?:\/\/[^\s]+)/g は末尾の句読点も URL に含める。
    expect(toLinkSegments('https://example.com/path?q=1。')[0]).toEqual({
      text: 'https://example.com/path?q=1。',
      isUrl: true
    });
  });
});
