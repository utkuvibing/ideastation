import { redirect } from 'next/navigation';
import { login } from '../actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (process.env.AUTH_MODE === 'trusted-header') redirect('/');
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-lg font-bold text-white dark:bg-violet-500">IS</span>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">AsunaTech</p>
            <h1 className="text-2xl font-bold">IdeaStation</h1>
          </div>
        </div>
        <form action={login} className="card space-y-4 p-6">
          {params.error && <div role="alert" className="alert-error">Email veya parola hatalı.</div>}
          <label>
            Email
            <input name="email" type="email" placeholder="ornek@firma.com" autoComplete="email" required />
          </label>
          <label>
            Parola
            <input name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
          </label>
          <button className="w-full">Giriş yap</button>
        </form>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">Kısa video fikirlerini yönet, üret ve yayınla.</p>
      </div>
    </main>
  );
}
