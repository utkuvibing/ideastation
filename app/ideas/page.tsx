import { db } from '@/lib/db';
import { IdeaCreateForm } from '@/components/idea-create-form';
import { StatusBadge } from '@/components/status-badge';

export const dynamic = 'force-dynamic';

export default function Ideas() {
  const apps: { id: number; name: string }[] = db.prepare('select id, name from apps where deleted_at is null order by name').all() as {
    id: number;
    name: string;
  }[];
  const ideas: {
    id: number;
    title: string;
    app_name?: string;
    format?: string;
    status?: string;
    hook?: string;
  }[] = db
    .prepare(
      'select ideas.*, apps.name app_name from ideas left join apps on apps.id=ideas.app_id where ideas.deleted_at is null order by ideas.id desc',
    )
    .all() as {
    id: number;
    title: string;
    app_name?: string;
    format?: string;
    status?: string;
    hook?: string;
  }[];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header>
          <h1 className="text-2xl font-bold">Ideas</h1>
          <p className="page-subtitle">{ideas.length} fikir · tüm app&apos;ler</p>
        </header>
        <div className="flex gap-2">
          <a className="btn btn-secondary" href="/api/export/ideas.csv">CSV indir</a>
          <a className="btn btn-secondary" href="/api/export/ideas.pdf">PDF indir</a>
        </div>
      </div>
      {!apps.length ? (
        <div className="card py-10 text-center">
          <h2 className="font-semibold">Önce bir app ekle</h2>
          <p className="muted mt-1 text-sm">Fikirler bir app&apos;e bağlı oluşturulur.</p>
          <a className="btn mt-4 inline-flex" href="/apps">Apps sayfasına git</a>
        </div>
      ) : (
        <IdeaCreateForm apps={apps} />
      )}
      <div className="space-y-3">
        {!ideas.length && apps.length > 0 && (
          <div className="card py-12 text-center">
            <h2 className="font-semibold">Henüz fikir yok</h2>
            <p className="muted mt-1 text-sm">“Yeni fikir ekle” ile ilk fikri oluştur.</p>
          </div>
        )}
        {ideas.map((i) => (
          <a className="card card-hover block" href={`/ideas/${i.id}`} key={i.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="min-w-0 truncate font-semibold">{i.title}</h2>
              <StatusBadge status={i.status} />
            </div>
            <p className="muted mt-1 text-sm">
              {[i.app_name, i.format].filter(Boolean).join(' · ')}
            </p>
            {i.hook && <p className="mt-2 line-clamp-2 text-sm">{i.hook}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
