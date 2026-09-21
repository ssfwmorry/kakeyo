import { LoginForm } from './login-form';

// login 画面。ログイン済みユーザの /note へのリダイレクトは proxy.ts が担う。

export default function LoginPage() {
  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <LoginForm />
    </div>
  );
}
