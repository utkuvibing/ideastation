'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const iconPaths: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  apps: <><rect x="4" y="2.5" width="16" height="19" rx="3" /><path d="M10 18.5h4" /></>,
  ideas: <><path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.46c.74.66 1.34 1.55 1.34 2.54h5.32c0-.99.6-1.88 1.34-2.54A6 6 0 0 0 12 3Z" /></>,
  kanban: <><rect x="3" y="3" width="5.5" height="18" rx="1.5" /><rect x="12.5" y="3" width="5.5" height="12" rx="1.5" /></>,
  ai: <><path d="M12 3v2.5M12 18.5V21M5.6 5.6l1.77 1.77M16.63 16.63l1.77 1.77M3 12h2.5M18.5 12H21M5.6 18.4l1.77-1.77M16.63 7.37l1.77-1.77" /><circle cx="12" cy="12" r="3" /></>,
  reports: <><path d="M4 20V10m5.33 10V4m5.34 16v-7M20 20v-3" /></>,
  library: <><path d="M5 3.5h11A2.5 2.5 0 0 1 18.5 6v14.5H7A2 2 0 0 1 5 18.5v-15Z" /><path d="M5 16.5h13.5" /></>,
  notifications: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M10.3 19a2 2 0 0 0 3.4 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a7.7 7.7 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.7 7.7 0 0 0 2.6 1.5l.5 2.6h4l.5-2.6a7.7 7.7 0 0 0 2.6-1.5l2.3 1 2-3.4Z" /></>,
};

const links = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/apps', label: 'Apps', icon: 'apps' },
  { href: '/ideas', label: 'Ideas', icon: 'ideas' },
  { href: '/kanban', label: 'Kanban', icon: 'kanban' },
  { href: '/ai-brainstorm', label: 'AI Brainstorm', icon: 'ai' },
  { href: '/reports', label: 'Reports', icon: 'reports' },
  { href: '/library', label: 'Library', icon: 'library' },
  { href: '/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

function NavIcon({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      {iconPaths[name]}
    </svg>
  );
}

export function NavLinks({ variant }: { variant: 'sidebar' | 'topbar' }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  if (variant === 'topbar') {
    return (
      <nav aria-label="Mobil navigasyon" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-violet-600 text-white dark:bg-violet-500'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
            }`}
          >
            <NavIcon name={link.icon} />
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Ana navigasyon" className="grid gap-0.5">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(link.href)
              ? 'bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
          }`}
        >
          <NavIcon name={link.icon} />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
