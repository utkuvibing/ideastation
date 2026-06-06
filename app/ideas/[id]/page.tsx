import { db } from '@/lib/db';
import { addFeedback, deleteIdea } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { ideaFieldLabels } from '@/lib/field-labels';

export const dynamic = 'force-dynamic';

export default async function IdeaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea: any = db.prepare(
    'select ideas.*, apps.name app_name from ideas left join apps on apps.id=ideas.app_id where ideas.id=?',
  ).get(id);
  const feedback: any[] = db.prepare('select * from feedback where idea_id=? order by id desc').all(id);
  if (!idea) return <div>Bulunamadı</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{idea.title}</h1>
        <DeleteEntityButton
          action={deleteIdea}
          entityId={idea.id}
          idField="idea_id"
          entityName={idea.title}
          entityType="fikir"
        />
      </div>
      <div className="card space-y-2">
        <p className="opacity-60">{idea.app_name} / {idea.format} / {idea.status}</p>
        {Object.entries(ideaFieldLabels).map(([key, label]) => idea[key] && (
          <p key={key}><b>{label}:</b> {idea[key]}</p>
        ))}
      </div>
      <form action={addFeedback} className="card grid gap-3 md:grid-cols-2">
        <input type="hidden" name="idea_id" value={idea.id} />
        <select name="sentiment">
          <option value="positive">Olumlu</option>
          <option value="negative">Olumsuz</option>
        </select>
        <input name="viral_score" type="number" min="1" max="5" placeholder="Viral potansiyeli (1-5)" />
        <input name="ease_score" type="number" min="1" max="5" placeholder="Üretim kolaylığı (1-5)" />
        <input name="brand_fit_score" type="number" min="1" max="5" placeholder="Marka uyumu (1-5)" />
        <input name="originality_score" type="number" min="1" max="5" placeholder="Özgünlük (1-5)" />
        <textarea name="comment" placeholder="Yorum" className="md:col-span-2" />
        <button>Geri bildirim ver</button>
      </form>
      <section className="card">
        <h2 className="mb-2 font-bold">Geri bildirimler</h2>
        {feedback.map((item) => (
          <div className="border-t py-2" key={item.id}>
            <b>{item.user_name}</b> {item.sentiment} — {item.comment}
            <p className="text-sm opacity-60">
              Viral: {item.viral_score} · Kolaylık: {item.ease_score} · Marka: {item.brand_fit_score} · Özgünlük: {item.originality_score}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
