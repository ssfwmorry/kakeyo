import { redirect } from 'next/navigation';

// INDEX（/）はリダイレクト専用。
// 通常は proxy.ts が到達前に振り分ける（ログイン→/calendar、未ログイン→/login）。
// 直接到達した場合のフォールバックとして /login へ。
export default function Home() {
  redirect('/login');
}
