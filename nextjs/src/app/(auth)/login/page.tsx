import { LoginForm } from '@/features/auth';

// login 画面。実装は features/auth に集約し、ここはルーティングと配置のみ。
// ログイン済みユーザの /note へのリダイレクトは proxy.ts が担う。

export default function LoginPage() {
  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <LoginForm />
    </div>
  );
}
