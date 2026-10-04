// SW のキャッシュ名。public/sw.js はビルド対象外の素の JS でこの定数を import
// できないため、同じ文字列が両方にある。片方だけ変えるとログアウト時に消す対象と
// SW が使う領域がずれ、古い画面が残る。
export const PAGE_CACHE = 'kakeyo-pages-v1';
