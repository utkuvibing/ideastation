import { db } from '@/lib/db';
import { IdeaCreateForm } from '@/components/idea-create-form';

export const dynamic = 'force-dynamic';

export default function Ideas() {
  const apps: { id: number; name: string }[] = db.prepare('select id, name from apps order by name').all() as {
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
      'select ideas.*, apps.name app_name from ideas left join apps on apps.id=ideas.app_id order by ideas.id desc',
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
      <h1 className="text-3xl font-bold">Ideas</h1>
      {!apps.length ? (
        <p className="card text-sm opacity-70">Önce Apps sayfasından bir app ekle.</p>
      ) : (
        <IdeaCreateForm apps={apps} />
      )}
      <div className="space-y-3">
        {ideas.map((i) => (
          <a className="card block" href={`/ideas/${i.id}`} key={i.id}>
            <b>{i.title}</b>
            <p className="opacity-60">
              {i.app_name} / {i.format} / {i.status}
            </p>
            <p>{i.hook}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
