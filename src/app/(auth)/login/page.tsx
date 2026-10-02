import { LoginScreen } from '@/features/auth';

// login 画面。実装は features/auth に集約し、ここはルーティングと配置のみ。
// 幅は (private) のシェルと同じ max-w-md に揃え、PC では中央に寄せる。
// ログイン済みユーザの /calendar へのリダイレクトは proxy.ts が担う。

export default function LoginPage() {
  return (
    <div className='mx-auto flex min-h-dvh w-full max-w-md flex-col px-5'>
      <LoginScreen />
    </div>
  );
}
