'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { updateIdeaStatusDirect } from '@/app/actions';
import { IdeaCreateForm } from '@/components/idea-create-form';
import { ideaStatuses, type IdeaStatus } from '@/lib/idea-statuses';

type Idea = {
  id: number;
  app_id: number | null;
  app_name: string | null;
  title: string;
  format: string | null;
  status: string;
  hook: string | null;
  ai_score: number | null;
  updated_at: string;
};

type App = { id: number; name: string; category?: string | null; one_liner?: string | null };

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium shadow-none transition-colors ${
        active
          ? 'bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400'
          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
  );
}

export function KanbanBoard({ initialIdeas, apps }: { initialIdeas: Idea[]; apps: App[] }) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [query, setQuery] = useState('');
  const [appId, setAppId] = useState(apps[0] ? String(apps[0].id) : 'all');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedApp = apps.find((app) => String(app.id) === appId);
  const appIdeas = ideas.filter((idea) => appId === 'all' || String(idea.app_id) === appId);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr');
    return ideas.filter((idea) => {
      const matchesApp = appId === 'all' || String(idea.app_id) === appId;
      const haystack = `${idea.title} ${idea.hook || ''} ${idea.app_name || ''}`.toLocaleLowerCase('tr');
      return matchesApp && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [ideas, query, appId]);

  function moveIdea(ideaId: number, status: IdeaStatus) {
    const current = ideas.find((idea) => idea.id === ideaId);
    if (!current || current.status === status) return;
    const previousStatus = current.status;
    setIdeas((items) => items.map((idea) => idea.id === ideaId ? { ...idea, status } : idea));
    startTransition(async () => {
      try {
        await updateIdeaStatusDirect(ideaId, status);
      } catch {
        setIdeas((items) => items.map((idea) => idea.id === ideaId ? { ...idea, status: previousStatus } : idea));
      }
    });
  }

  if (!apps.length) {
    return (
      <div className="card grid min-h-80 place-items-center text-center">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Önce bir app oluştur</h2>
            <p className="muted mt-1 text-sm">Kanban kartları bir app&apos;e bağlı çalışır.</p>
          </div>
          <Link href="/apps" className="btn inline-flex">Apps sayfasına git</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="App filtresi">
        <FilterPill active={appId === 'all'} onClick={() => setAppId('all')}>
          Tüm app’ler <span className="opacity-70">({ideas.length})</span>
        </FilterPill>
        {apps.map((app) => {
          const count = ideas.filter((idea) => idea.app_id === app.id).length;
          return (
            <FilterPill key={app.id} active={appId === String(app.id)} onClick={() => setAppId(String(app.id))}>
              {app.name} <span className="opacity-70">({count})</span>
            </FilterPill>
          );
        })}
      </div>

      {selectedApp && (
        <div className="card flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{selectedApp.name}</h2>
              {selectedApp.category && <span className="badge badge-neutral">{selectedApp.category}</span>}
            </div>
            {selectedApp.one_liner && <p className="muted mt-1 max-w-4xl text-sm">{selectedApp.one_liner}</p>}
          </div>
          <div className="flex gap-2">
            <Link href={`/apps/${selectedApp.id}`} className="btn btn-secondary">App brief’i</Link>
            <Link href={`/ai-brainstorm?app_id=${selectedApp.id}`} className="btn">AI brainstorm</Link>
          </div>
        </div>
      )}

      <IdeaCreateForm
        key={appId}
        apps={selectedApp ? [selectedApp] : apps}
        defaultAppId={selectedApp?.id}
        returnTo="/kanban"
        initiallyOpen={Boolean(selectedApp && !appIdeas.length)}
        compact
      />

      <div className="card flex flex-wrap items-center gap-3 py-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Fikir veya hook ara"
          aria-label="Fikir veya hook ara"
          className="min-w-64 flex-1"
        />
        <span className="muted text-sm tabular-nums" aria-live="polite">{filtered.length} fikir gösteriliyor</span>
        {isPending && <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Kaydediliyor...</span>}
      </div>

      {!appIdeas.length && selectedApp && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <h2 className="font-semibold">{selectedApp.name} için henüz Kanban kartı yok</h2>
          <p className="muted mt-1 text-sm">Yukarıdaki açık formdan ilk fikri ekleyebilir veya AI brainstorm başlatabilirsin.</p>
        </div>
      )}

      <div className="flex snap-x gap-4 overflow-x-auto pb-5">
        {ideaStatuses.map((status) => {
          const columnIdeas = filtered.filter((idea) => idea.status === status.id);
          return (
            <section
              key={status.id}
              className="min-h-72 w-80 min-w-80 max-w-80 snap-start rounded-xl border border-zinc-200 bg-zinc-100/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedId !== null) moveIdea(draggedId, status.id);
                setDraggedId(null);
              }}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{status.label}</h2>
                <span className="badge badge-neutral tabular-nums">{columnIdeas.length}</span>
              </header>
              <div className="space-y-3">
                {columnIdeas.map((idea) => (
                  <article
                    key={idea.id}
                    draggable
                    onDragStart={() => setDraggedId(idea.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={`card cursor-grab space-y-3 p-3.5 transition-shadow hover:shadow-md active:cursor-grabbing sm:p-3.5 ${draggedId === idea.id ? 'opacity-60 ring-2 ring-violet-400' : ''}`}
                  >
                    <Link href={`/ideas/${idea.id}`} className="block space-y-1 transition-opacity hover:opacity-80">
                      <h3 className="text-sm font-semibold leading-snug">{idea.title}</h3>
                      <p className="muted text-xs">{idea.app_name || 'Appsiz'} · {idea.format || 'Formatsız'}</p>
                      {idea.hook && <p className="line-clamp-3 text-sm">{idea.hook}</p>}
                    </Link>
                    <div className="flex items-center gap-2">
                      {Boolean(idea.ai_score) && <span className="badge bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">AI {idea.ai_score}/10</span>}
                      <select aria-label={`${idea.title} durumunu değiştir`} value={idea.status} onChange={(event) => moveIdea(idea.id, event.target.value as IdeaStatus)} className="ml-auto max-w-40 py-1 text-xs">
                        {ideaStatuses.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    </div>
                  </article>
                ))}
                {!columnIdeas.length && (
                  <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                    Kartı buraya sürükle
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
