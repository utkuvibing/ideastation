import { db } from '@/lib/db';
import { addComment, addFeedback, addPerformanceMetric, deleteIdea, updateIdea } from '@/app/actions';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { ideaStatuses } from '@/lib/idea-statuses';
import { ideaSimilarity } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export default async function IdeaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = db.prepare('select ideas.*, apps.name app_name from ideas join apps on apps.id=ideas.app_id where ideas.id=? and ideas.deleted_at is null').get(id) as Record<string, any> | undefined;
  if (!idea) return <div className="card">Fikir bulunamadi.</div>;
  const apps = db.prepare('select id,name from apps where deleted_at is null order by name').all() as {id:number;name:string}[];
  const feedback = db.prepare('select * from feedback where idea_id=? order by id desc').all(id) as Record<string, any>[];
  const comments = db.prepare('select * from comments where idea_id=? order by id desc').all(id) as Record<string, any>[];
  const revisions = db.prepare("select * from revisions where entity_type='idea' and entity_id=? order by id desc limit 20").all(id) as Record<string, any>[];
  const metrics = db.prepare('select * from performance_metrics where idea_id=? order by report_date desc,id desc').all(id) as Record<string, any>[];
  const candidates = db.prepare('select id,title,hook,description from ideas where id<>? and deleted_at is null').all(id) as {id:number;title:string;hook:string|null;description:string|null}[];
  const similar: Array<{id:number;title:string;score:number}> = candidates.map((candidate) => ({ id: candidate.id, title: candidate.title, score: ideaSimilarity(`${idea.title} ${idea.hook || ''} ${idea.description || ''}`, `${candidate.title} ${candidate.hook || ''} ${candidate.description || ''}`) })).filter((candidate) => candidate.score >= 0.35).sort((a,b) => b.score-a.score).slice(0,5);
  const textFields = ['description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','source','competitor_url','competitor_notes'];
  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-bold">{idea.title}</h1><DeleteEntityButton action={deleteIdea} entityId={idea.id} idField="idea_id" entityName={idea.title} entityType="fikir" /></div>
    <form action={updateIdea} className="card grid gap-3 md:grid-cols-2">
      <input type="hidden" name="idea_id" value={idea.id}/><label>App<select name="app_id" defaultValue={idea.app_id}>{apps.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Title<input name="title" defaultValue={idea.title}/></label><label>Format<input name="format" defaultValue={idea.format || ''}/></label>
      <label>Status<select name="status" defaultValue={idea.status}>{ideaStatuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      {textFields.map(field=><label key={field}>{field}<textarea name={field} defaultValue={idea[field] || ''}/></label>)}
      <label>AI score<input name="ai_score" type="number" min="0" max="10" defaultValue={idea.ai_score ?? ''}/></label><label>Owner<input name="owner" type="email" defaultValue={idea.owner || ''}/></label>
      <label>Team<input name="team" defaultValue={idea.team || ''}/></label><label>Deadline<input name="deadline" type="date" defaultValue={idea.deadline || ''}/></label>
      <label>Priority<select name="priority" defaultValue={idea.priority || 'medium'}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      {['tags','campaign','channel','country','language'].map(field=><label key={field}>{field}<input name={field} defaultValue={idea[field] || ''}/></label>)}
      <button className="md:col-span-2">Degisiklikleri kaydet</button>
    </form>
    {similar.length > 0 && <section className="card border-amber-500/40"><h2 className="font-bold">Benzer fikirler</h2>{similar.map(item=><a className="block border-t py-2" href={`/ideas/${item.id}`} key={item.id}>{item.title} / %{Math.round(item.score*100)}</a>)}</section>}
    <form action={addComment} className="card space-y-3"><input type="hidden" name="idea_id" value={idea.id}/><h2 className="font-bold">Yorum ve mention</h2><label className="block">Yorum<textarea name="body" required className="w-full"/></label><button>Yorum ekle</button>{comments.map(c=><p className="border-t pt-2" key={c.id}><b>{c.user_name}</b>: {c.body}</p>)}</form>
    <form action={addFeedback} className="card grid gap-3 md:grid-cols-2"><input type="hidden" name="idea_id" value={idea.id}/><label>Sentiment<select name="sentiment"><option value="positive">Olumlu</option><option value="negative">Olumsuz</option></select></label>{['viral_score','ease_score','brand_fit_score','originality_score'].map(f=><label key={f}>{f}<input name={f} type="number" min="0" max="10" required/></label>)}<label>Comment<textarea name="comment"/></label><button>Feedback ekle</button>{feedback.map(f=><p key={f.id}>{f.user_name}: {f.comment}</p>)}</form>
    {idea.status === 'published' && <form action={addPerformanceMetric} className="card grid gap-3 md:grid-cols-2"><input type="hidden" name="idea_id" value={idea.id}/><h2 className="font-bold md:col-span-2">Performans metrigi</h2><label>Platform<input name="platform" required/></label><label>Report date<input name="report_date" type="date" required/></label>{['spend','impressions','views','clicks','installs','conversions','revenue'].map(field=><label key={field}>{field}<input name={field} type="number" min="0" step={field==='spend'||field==='revenue'?'0.01':'1'} defaultValue="0"/></label>)}<button>Kaydet</button></form>}
    {metrics.length > 0 && <section className="card overflow-x-auto"><h2 className="font-bold">Performance</h2><table className="w-full text-sm"><tbody>{metrics.map(m=><tr className="border-t" key={m.id}><td>{m.report_date}</td><td>{m.platform}</td><td>{m.spend}</td><td>{m.views} views</td><td>{m.clicks} clicks</td><td>{m.installs} installs</td><td>{m.revenue} revenue</td></tr>)}</tbody></table></section>}
    <section className="card"><h2 className="font-bold">Revision history</h2>{revisions.map(r=><details className="border-t py-2" key={r.id}><summary>{r.created_at} / {r.changed_by}</summary><pre className="overflow-auto text-xs">{JSON.stringify(JSON.parse(r.snapshot), null, 2)}</pre></details>)}</section>
  </div>;
}
