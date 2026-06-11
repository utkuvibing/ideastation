import { db } from '@/lib/db';
import { AppCreateForm } from '@/components/app-create-form';

export const dynamic = 'force-dynamic';

export default function Apps() {
  const apps: { id: number; name: string; one_liner?: string }[] = db
    .prepare('select id, name, one_liner from apps where deleted_at is null order by id desc')
    .all() as { id: number; name: string; one_liner?: string }[];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Apps</h1>
        <p className="page-subtitle">Her app için marka brief&apos;i oluştur; fikirler ve AI brainstorm bu brief&apos;i kullanır.</p>
      </header>
      <AppCreateForm />
      {!apps.length && (
        <div className="card py-12 text-center">
          <h2 className="font-semibold">Henüz app yok</h2>
          <p className="muted mt-1 text-sm">Yukarıdaki formla ilk app brief&apos;ini oluştur.</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {apps.map((a) => (
          <a className="card card-hover" href={`/apps/${a.id}`} key={a.id}>
            <h2 className="font-semibold">{a.name}</h2>
            <p className="muted mt-1 line-clamp-2 text-sm">{a.one_liner || 'Kısa tanım eklenmemiş.'}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
