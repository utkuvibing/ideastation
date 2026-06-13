'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { ideaStatuses } from '@/lib/idea-statuses';

export type IdeaListItem = {
  id: number;
  title: string;
  app_name?: string | null;
  format?: string | null;
  status?: string | null;
  hook?: string | null;
};

type SortMode = 'newest' | 'title' | 'status';

function normalize(value: string | null | undefined) {
  return (value || '').toLocaleLowerCase('tr');
}

export function IdeaList({ ideas }: { ideas: IdeaListItem[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortMode>('newest');

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    const matchesQuery = (idea: IdeaListItem) => {
      if (!normalizedQuery) return true;
      const haystack = [idea.title, idea.app_name, idea.format, idea.status, idea.hook].map(normalize).join(' ');
      return haystack.includes(normalizedQuery);
    };

    return ideas
      .filter((idea) => (status === 'all' ? true : idea.status === status))
      .filter(matchesQuery)
      .sort((left, right) => {
        switch (sort) {
          case 'newest':
            return right.id - left.id;
          case 'title':
            return left.title.localeCompare(right.title, 'tr');
          case 'status':
            return normalize(left.status).localeCompare(normalize(right.status), 'tr');
          default: {
            const exhaustive: never = sort;
            return exhaustive;
          }
        }
      });
  }, [ideas, query, status, sort]);

  if (!ideas.length) {
    return (
      <div className="card py-12 text-center">
        <h2 className="font-semibold">Henüz fikir yok</h2>
        <p className="muted mt-1 text-sm">“Yeni fikir ekle” ile ilk fikri oluştur.</p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="card grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
        <label className="gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ara</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Başlık, app, format veya hook ara"
          />
        </label>
        <label className="gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Durum</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tüm durumlar</option>
            {ideaStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sırala</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="newest">En yeni</option>
            <option value="title">Başlık A-Z</option>
            <option value="status">Durum</option>
          </select>
        </label>
        <div className="flex items-end">
          <span className="badge badge-neutral h-9 px-3 tabular-nums" aria-live="polite">
            {filteredIdeas.length}/{ideas.length} fikir
          </span>
        </div>
      </div>

      {!filteredIdeas.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <h2 className="font-semibold">Eşleşen fikir bulunamadı</h2>
          <p className="muted mt-1 text-sm">Arama metnini veya durum filtresini değiştirerek tekrar dene.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredIdeas.map((idea) => (
            <Link className="card card-hover group block" href={`/ideas/${idea.id}`} key={idea.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">{idea.title}</h2>
                  <p className="muted mt-1 text-sm">
                    {[idea.app_name, idea.format].filter(Boolean).join(' · ') || 'Meta bilgi eklenmemiş'}
                  </p>
                </div>
                <StatusBadge status={idea.status} />
              </div>
              {idea.hook && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{idea.hook}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
