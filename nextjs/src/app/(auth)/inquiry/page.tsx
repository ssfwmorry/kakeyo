import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

// inquiry（問い合わせ）画面。未ログインでもアクセス可（proxy.ts の publicPaths に '/inquiry'）。
// 静的な案内文の表示のみで API 呼び出しなし。認証 layout を持たない (auth) グループに配置し、
// URL を /inquiry に一致させて publicPaths と整合させている。
// TODO: 内容差し替え予定（旧 pages/inquiry.vue の暫定文言を流用）。

export default function InquiryPage() {
  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>お問い合わせ</CardTitle>
          <CardDescription>
            {/* TODO: 差し替え予定 */}
            なんらかの方法でコンタクトをとってください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href='/login' className='text-sm underline underline-offset-4'>
            ログイン画面へ戻る
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
