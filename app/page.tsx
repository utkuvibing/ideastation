import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Dashboard(){ if(!(await getSession())) redirect('/login');
const stats:any = { apps: db.prepare('select count(*) c from apps').get(), ideas: db.prepare('select count(*) c from ideas').get(), feedback: db.prepare('select count(*) c from feedback').get() };
const recent:any[] = db.prepare('select ideas.*, apps.name app_name from ideas left join apps on apps.id=ideas.app_id order by ideas.id desc limit 8').all();
return <div className="space-y-6"><h1 className="text-3xl font-bold">Dashboard</h1><div className="grid md:grid-cols-3 gap-4"><div className="card">Apps<br/><b className="text-3xl">{stats.apps.c}</b></div><div className="card">Ideas<br/><b className="text-3xl">{stats.ideas.c}</b></div><div className="card">Feedback<br/><b className="text-3xl">{stats.feedback.c}</b></div></div><section className="card"><h2 className="font-bold mb-3">Recent Ideas</h2>{recent.map(i=><div className="border-t py-2" key={i.id}>{i.title} <span className="text-sm opacity-60">/ {i.app_name} / {i.status}</span></div>)}</section></div>}
