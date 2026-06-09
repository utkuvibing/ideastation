import { db } from '@/lib/db';
import { AppCreateForm } from '@/components/app-create-form';

export const dynamic = 'force-dynamic';

export default function Apps() {
  const apps: { id: number; name: string; one_liner?: string }[] = db
    .prepare('select id, name, one_liner from apps where deleted_at is null order by id desc')
    .all() as { id: number; name: string; one_liner?: string }[];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Apps</h1>
      <AppCreateForm />
      <div className="grid md:grid-cols-2 gap-4">
        {apps.map((a) => (
          <a className="card" href={`/apps/${a.id}`} key={a.id}>
            <b>{a.name}</b>
            <p className="opacity-70">{a.one_liner}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
