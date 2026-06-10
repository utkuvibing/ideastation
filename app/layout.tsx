import './globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions';
import { AIJobToasts } from '@/components/ai-job-toasts';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const name = session?.email;
  return <html lang="tr" suppressHydrationWarning><body>
    {name ? <div className="min-h-screen flex flex-col md:flex-row">
      <nav aria-label="Mobil navigasyon" className="flex gap-2 overflow-x-auto border-b p-3 md:hidden">
        {['Dashboard','Apps','Ideas','Kanban','Reports','Library','Notifications'].map(x => <Link className="btn whitespace-nowrap text-sm" href={x==='Dashboard'?'/':`/${x.toLowerCase()}`} key={x}>{x}</Link>)}
      </nav>
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-3 hidden md:block">
        <div className="font-bold text-lg">Short Video Ideas</div>
        <div className="text-xs opacity-60">{session?.role}</div>
        {['Dashboard','Apps','Ideas','Kanban','AI Brainstorm','Reports','Library','Notifications','Settings'].map(x => <Link className="block rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" href={x==='Dashboard'?'/':`/${x.toLowerCase().replaceAll(' ','-')}`} key={x}>{x}</Link>)}
        <form action={logout}><button className="w-full">Çıkış yap</button></form>
      </aside>
      <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      <AIJobToasts />
    </div> : children}
  </body></html>;
}
