import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { FlashToast } from '@/components/form/flash-toast';
import { Toaster } from '@/components/ui/sonner';
import { SwRegister } from '@/features/pwa/components/sw-register';
import './globals.css';

// 日本語フォントは Web フォントで配らず OS のものを使う。
//
// 「英数字と日本語で字面が混ざる」問題は Noto Sans JP を読ませれば解消するが、
// 日本語の Web フォントは unicode-range で 100 本超のスライスに分割されており、
// subsets:['latin'] でも weight 固定でも CJK スライスは落とせない。実測で
// カレンダー画面 1 枚あたり woff2 が 26 本・約 500KB 追加で流れた。家計簿は毎日
// 開くアプリなので、この転送量と日本語だけ遅れて差し替わる FOUT は、字面の統一に
// 見合わないと判断した。
//
// 代わりに font-family を globals.css で明示し（OS ごとのヒラギノ / 游ゴシック /
// Noto Sans JP ローカル）、どの端末でどの書体になるかを意図して固定する。
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'かけよ',
  description: '個人・ペア向けの家計簿アプリ'
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='ja' className={`${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        {children}
        {/* トーストは画面下中央に出す。 */}
        <Toaster position='bottom-center' />
        <FlashToast />
        <SwRegister />
      </body>
    </html>
  );
}
