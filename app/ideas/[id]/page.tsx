import Link from 'next/link';
import { db } from '@/lib/db';
import { addComment, addFeedback, addPerformanceMetric, deleteIdea, updateIdea } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { StatusBadge } from '@/components/status-badge';
import { ideaStatuses } from '@/lib/idea-statuses';
import { ideaFieldLabels } from '@/lib/field-labels';
import { ideaSimilarity } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

const scoreLabels: Record<string, string> = {
  viral_score: 'Viral skoru',
  ease_score: 'Kolaylık skoru',
  brand_fit_score: 'Marka uyumu',
  originality_score: 'Özgünlük',
};

const metricLabels: Record<string, string> = {
  spend: 'Spend', impressions: 'Impressions', views: 'Views', clicks: 'Clicks',
  installs: 'Installs', conversions: 'Conversions', revenue: 'Revenue',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 md:col-span-2">{children}</h3>;
}

export default async function IdeaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = db.prepare('select ideas.*, apps.name app_name from ideas join apps on apps.id=ideas.app_id where ideas.id=? and ideas.deleted_at is null').get(id) as Record<string, any> | undefined;
  if (!idea) return (
    <div className="card py-12 text-center">
      <h1 className="font-semibold">Fikir bulunamadı</h1>
      <p className="muted mt-1 text-sm">Silinmiş veya hiç oluşturulmamış olabilir.</p>
      <Link className="btn mt-4 inline-flex" href="/ideas">Fikir listesine dön</Link>
    </div>
  );
  const apps = db.prepare('select id,name from apps where deleted_at is null order by name').all() as {id:number;name:string}[];
  const feedback = db.prepare('select * from feedback where idea_id=? order by id desc').all(id) as Record<string, any>[];
  const comments = db.prepare('select * from comments where idea_id=? order by id desc').all(id) as Record<string, any>[];
  const revisions = db.prepare("select * from revisions where entity_type='idea' and entity_id=? order by id desc limit 20").all(id) as Record<string, any>[];
  const metrics = db.prepare('select * from performance_metrics where idea_id=? order by report_date desc,id desc').all(id) as Record<string, any>[];
  const candidates = db.prepare('select id,title,hook,description from ideas where id<>? and deleted_at is null').all(id) as {id:number;title:string;hook:string|null;description:string|null}[];
  const similar: Array<{id:number;title:string;score:number}> = candidates.map((candidate) => ({ id: candidate.id, title: candidate.title, score: ideaSimilarity(`${idea.title} ${idea.hook || ''} ${idea.description || ''}`, `${candidate.title} ${candidate.hook || ''} ${candidate.description || ''}`) })).filter((candidate) => candidate.score >= 0.35).sort((a,b) => b.score-a.score).slice(0,5);
  const textFields = ['description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','source','competitor_url','competitor_notes'];
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <header className="min-w-0">
        <Link href="/ideas" className="muted text-sm hover:text-zinc-900 dark:hover:text-zinc-100">← Ideas</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{idea.title}</h1>
          <StatusBadge status={idea.status} />
        </div>
        <p className="page-subtitle">{[idea.app_name, idea.format].filter(Boolean).join(' · ')}</p>
      </header>
      <DeleteEntityButton action={deleteIdea} entityId={idea.id} idField="idea_id" entityName={idea.title} entityType="fikir" />
    </div>

    <form action={updateIdea} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="idea_id" value={idea.id}/>
      <SectionHeading>Temel bilgiler</SectionHeading>
      <label>App<select name="app_id" defaultValue={idea.app_id}>{apps.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Başlık<input name="title" defaultValue={idea.title}/></label>
      <label>Format<input name="format" defaultValue={idea.format || ''}/></label>
      <label>Durum<select name="status" defaultValue={idea.status}>{ideaStatuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <SectionHeading>İçerik</SectionHeading>
      {textFields.map(field=><label key={field}>{ideaFieldLabels[field] ?? field}<textarea name={field} defaultValue={idea[field] || ''}/></label>)}
      <SectionHeading>Planlama ve hedefleme</SectionHeading>
      <label>AI skoru (0-10)<input name="ai_score" type="number" min="0" max="10" defaultValue={idea.ai_score ?? ''}/></label>
      <label>Owner<input name="owner" type="email" defaultValue={idea.owner || ''}/></label>
      <label>Team<input name="team" defaultValue={idea.team || ''}/></label>
      <label>Deadline<input name="deadline" type="date" defaultValue={idea.deadline || ''}/></label>
      <label>Öncelik<select name="priority" defaultValue={idea.priority || 'medium'}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      {['tags','campaign','channel','country','language'].map(field=><label key={field} className="capitalize">{field}<input name={field} defaultValue={idea[field] || ''}/></label>)}
      <button className="md:col-span-2">Değişiklikleri kaydet</button>
    </form>

    {similar.length > 0 && <section className="card border-amber-500/40">
      <h2 className="font-semibold">Benzer fikirler</h2>
      <p className="muted mt-0.5 text-sm">Bu fikirle içerik benzerliği yüksek kayıtlar.</p>
      <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        {similar.map(item=>(
          <li key={item.id}>
            <a className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50" href={`/ideas/${item.id}`}>
              <span className="min-w-0 truncate font-medium">{item.title}</span>
              <span className="badge bg-amber-500/10 text-amber-700 dark:text-amber-300">%{Math.round(item.score*100)} benzer</span>
            </a>
          </li>
        ))}
      </ul>
    </section>}

    <form action={addComment} className="card space-y-3">
      <input type="hidden" name="idea_id" value={idea.id}/>
      <h2 className="font-semibold">Yorum ve mention</h2>
      <label>Yorum<textarea name="body" placeholder="@email ile mention edebilirsin" required/></label>
      <button>Yorum ekle</button>
      {!comments.length && <p className="muted text-sm">Henüz yorum yok.</p>}
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {comments.map(c=><li className="py-2.5 text-sm" key={c.id}><b>{c.user_name}</b>: {c.body}</li>)}
      </ul>
    </form>

    <form action={addFeedback} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="idea_id" value={idea.id}/>
      <h2 className="font-semibold md:col-span-2">Feedback</h2>
      <label>Sentiment<select name="sentiment"><option value="positive">Olumlu</option><option value="negative">Olumsuz</option></select></label>
      {['viral_score','ease_score','brand_fit_score','originality_score'].map(f=><label key={f}>{scoreLabels[f] ?? f} (0-10)<input name={f} type="number" min="0" max="10" required/></label>)}
      <label className="md:col-span-2">Yorum<textarea name="comment" placeholder="İsteğe bağlı not"/></label>
      <button className="md:col-span-2">Feedback ekle</button>
      {feedback.length > 0 && <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 md:col-span-2">
        {feedback.map(f=><li className="py-2.5 text-sm" key={f.id}><b>{f.user_name}</b>{f.comment ? `: ${f.comment}` : ''}</li>)}
      </ul>}
    </form>

    {idea.status === 'published' && <form action={addPerformanceMetric} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="idea_id" value={idea.id}/>
      <h2 className="font-semibold md:col-span-2">Performans metriği</h2>
      <label>Platform<input name="platform" placeholder="TikTok, Meta..." required/></label>
      <label>Rapor tarihi<input name="report_date" type="date" required/></label>
      {['spend','impressions','views','clicks','installs','conversions','revenue'].map(field=><label key={field}>{metricLabels[field] ?? field}<input name={field} type="number" min="0" step={field==='spend'||field==='revenue'?'0.01':'1'} defaultValue="0"/></label>)}
      <button className="md:col-span-2">Kaydet</button>
    </form>}

    {metrics.length > 0 && <section className="card overflow-x-auto">
      <h2 className="font-semibold">Performance</h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr>{['Tarih','Platform','Spend','Views','Clicks','Installs','Revenue'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{metrics.map(m=><tr key={m.id}><td>{m.report_date}</td><td>{m.platform}</td><td className="tabular-nums">{m.spend}</td><td className="tabular-nums">{m.views}</td><td className="tabular-nums">{m.clicks}</td><td className="tabular-nums">{m.installs}</td><td className="tabular-nums">{m.revenue}</td></tr>)}</tbody>
      </table>
    </section>}

    <section className="card">
      <h2 className="font-semibold">Revizyon geçmişi</h2>
      {!revisions.length && <p className="muted mt-3 text-sm">Henüz revizyon kaydı yok.</p>}
      <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        {revisions.map(r=><details className="py-2" key={r.id}>
          <summary className="cursor-pointer rounded text-sm transition-colors hover:text-violet-600 dark:hover:text-violet-300">{r.created_at} · {r.changed_by}</summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">{JSON.stringify(JSON.parse(r.snapshot), null, 2)}</pre>
        </details>)}
      </div>
    </section>
  </div>;
}
