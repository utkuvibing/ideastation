import { db } from '@/lib/db';
import { KanbanBoard } from '@/components/kanban-board';

export const dynamic = 'force-dynamic';

export default function Kanban() {
  const ideas = db.prepare(`
    SELECT ideas.id, ideas.app_id, ideas.title, ideas.format, ideas.status,
      ideas.hook, ideas.ai_score, ideas.updated_at, apps.name AS app_name
    FROM ideas
    LEFT JOIN apps ON apps.id = ideas.app_id
    WHERE ideas.deleted_at IS NULL AND apps.deleted_at IS NULL
    ORDER BY ideas.updated_at DESC, ideas.id DESC
  `).all() as Parameters<typeof KanbanBoard>[0]['initialIdeas'];
  const apps = db.prepare('SELECT id, name, category, one_liner FROM apps WHERE deleted_at IS NULL ORDER BY name').all() as {
    id: number;
    name: string;
    category?: string;
    one_liner?: string;
  }[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Kanban</h1>
        <p className="mt-1 opacity-60">App seç, o app için kart oluştur ve fikirleri üretim aşamaları arasında taşı.</p>
      </div>
      <KanbanBoard initialIdeas={ideas} apps={apps} />
    </div>
  );
}
