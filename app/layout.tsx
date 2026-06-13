import './globals.css';
import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions';
import { AIJobToasts } from '@/components/ai-job-toasts';
import { NavLinks } from '@/components/nav-links';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-zinc-900 text-sm font-bold text-white shadow-sm shadow-violet-900/20 dark:from-violet-400 dark:to-violet-700">
        IS
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-bold">IdeaStation</div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">Short Video Ideas</div>
      </div>
    </div>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const name = session?.email;
  return <html lang="tr" suppressHydrationWarning><body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {name ? <div className="min-h-screen md:flex">
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 pt-3 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85 md:hidden">
          <div className="flex items-center justify-between px-3 pb-2">
            <BrandMark />
            <div className="flex items-center gap-1.5">
              <ThemeToggle className="btn-sm px-2.5" compact />
              <form action={logout}><button className="btn-ghost btn-sm">Çıkış</button></form>
            </div>
          </div>
          <NavLinks variant="topbar" />
        </header>
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white/80 shadow-sm shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/60 md:flex">
          <div className="border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
            <BrandMark />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <NavLinks variant="sidebar" />
          </div>
          <div className="space-y-3 border-t border-zinc-200/80 p-3 dark:border-zinc-800/80">
            <div className="px-3 leading-tight">
              <p className="truncate text-sm font-medium" title={name}>{name}</p>
              <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{session?.role}</p>
            </div>
            <div className="grid gap-1">
              <ThemeToggle className="w-full justify-start" />
              <form action={logout}>
                <button className="btn-ghost w-full justify-start">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Çıkış yap
                </button>
              </form>
            </div>
          </div>
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <AIJobToasts />
      </div> : children}
    </ThemeProvider>
  </body></html>;
}
