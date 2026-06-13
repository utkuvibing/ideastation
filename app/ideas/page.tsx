import { db } from '@/lib/db';
import { IdeaCreateForm } from '@/components/idea-create-form';
import { IdeaList, type IdeaListItem } from '@/components/idea-list';

export const dynamic = 'force-dynamic';

export default function Ideas() {
  const apps: { id: number; name: string }[] = db.prepare('select id, name from apps where deleted_at is null order by name').all() as {
    id: number;
    name: string;
  }[];
  const ideas: IdeaListItem[] = db
    .prepare(
      'select ideas.*, apps.name app_name from ideas left join apps on apps.id=ideas.app_id where ideas.deleted_at is null order by ideas.id desc',
    )
    .all() as IdeaListItem[];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="max-w-2xl">
          <h1 className="text-2xl font-bold">Ideas</h1>
          <p className="page-subtitle">{ideas.length} fikir · app, durum, format ve hook üzerinden yönet.</p>
        </header>
        <div className="flex flex-wrap gap-2">
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
      {apps.length > 0 && <IdeaList ideas={ideas} />}
    </div>
  );
}
