import { db } from '@/lib/db';
import { listOpenCodeModels } from '@/lib/ai';
import { runAIBrainstorm } from '../actions';
export const dynamic = 'force-dynamic';

const actions = ['Generate 10 Short-Form Ideas','Generate UGC Ad Ideas','Generate Viral Hooks','Generate Problem/Solution Ads','Generate App Demo Ideas','Generate Meme Concepts','Generate Trend Adaptations','Generate Competitor-Inspired Concepts','Generate Low-Budget Video Ideas','Improve App Brief','Custom Brainstorm'];

export default async function AIBrainstorm({ searchParams }: { searchParams: Promise<{ generation?: string; error?: string }> }){
  const params = await searchParams;
  const apps:any[]=db.prepare('select id,name from apps order by name').all();
  const gens:any[]=db.prepare('select ai_generations.*, apps.name app_name from ai_generations left join apps on apps.id=ai_generations.app_id order by ai_generations.id desc limit 20').all();
  let models:{id:string;label:string}[]=[]; let modelError='';
  try { models = await listOpenCodeModels(); } catch(e:any) { modelError = e.message || 'Model listesi alınamadı'; }
  const selected = params.generation ? gens.find(g=>String(g.id)===String(params.generation)) || db.prepare('select * from ai_generations where id=?').get(params.generation) as any : null;
  return <div className="space-y-6"><h1 className="text-3xl font-bold">AI Brainstorm</h1>
    {modelError && <div className="card border-red-500/40 text-red-600 dark:text-red-300">OpenCode bağlantı hatası: {modelError}</div>}
    {params.error && <div className="card border-red-500/40 text-red-600 dark:text-red-300">Model seçmelisin.</div>}
    <form action={runAIBrainstorm} className="card grid md:grid-cols-2 gap-3">
      <select name="app_id"><option value="">App seç</option>{apps.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select>
      {models.length > 0 ? <select name="model" required><option value="">Model seç</option>{models.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select> : <input name="model" required placeholder="provider:modelID manuel gir (örn: anthropic:claude-sonnet-4-5)" />}
      <select name="action">{actions.map(a=><option key={a}>{a}</option>)}</select>
      <textarea name="prompt" placeholder="Ek prompt / özel istek" className="md:col-span-2 min-h-32"/>
      <button>Generate</button>
    </form>
    {selected && <section className="card space-y-3"><h2 className="font-bold">Sonuç: {selected.action} / {selected.model}</h2><pre className="whitespace-pre-wrap text-sm">{selected.response}</pre></section>}
    <section className="card"><h2 className="font-bold mb-3">AI History</h2>{gens.map(g=><a href={`/ai-brainstorm?generation=${g.id}`} className="block border-t py-2" key={g.id}><b>{g.action}</b> <span className="opacity-60">/ {g.model} / {g.app_name || 'No app'}</span></a>)}</section>
  </div>
}
