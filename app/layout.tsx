import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const name = (await cookies()).get('user_name')?.value;
  return <html lang="tr" suppressHydrationWarning><body>
    {name ? <div className="min-h-screen flex">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-3 hidden md:block">
        <div className="font-bold text-lg">Short Video Ideas</div>
        {['Dashboard','Apps','Ideas','Kanban','AI Brainstorm','Settings'].map(x => <Link className="block rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" href={x==='Dashboard'?'/':`/${x.toLowerCase().replaceAll(' ','-')}`} key={x}>{x}</Link>)}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div> : children}
  </body></html>;
}
