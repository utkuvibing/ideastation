'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { chatWithOpenCode } from '@/lib/ai';
const allowedUsers = new Map([
  ['admin@miniteamflow.local', 'password'],
  ['admin2@miniteamflow.local', 'password'],
  ['employee@miniteamflow.local', 'password'],
  ['employee2@miniteamflow.local', 'password'],
]);

export async function login(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  if (!email || allowedUsers.get(email) !== password) redirect('/login?error=1');
  db.prepare('INSERT INTO users (name, company_name) VALUES (?, ?)').run(email, 'AsunaTech');
  (await cookies()).set('user_name', email, { httpOnly: true, sameSite: 'lax', path: '/' });
  redirect('/');
}

export async function createApp(form: FormData) {
  const fields = ['name','category','one_liner','target_audience','main_problem','core_features','unique_selling_points','competitors','brand_tone','content_style','dos','donts','winning_ads','failed_ads','app_store_link','play_store_link','ai_instructions'];
  const result = db.prepare(`INSERT INTO apps (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...fields.map(f => String(form.get(f)||'')));
  redirect(`/ai-brainstorm?app_id=${result.lastInsertRowid}`);
}

export async function createIdea(form: FormData) {
  const name = (await cookies()).get('user_name')?.value || 'unknown';
  const fields = ['app_id','title','format','status','description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','ai_score','source','competitor_url','competitor_notes'];
  db.prepare(`INSERT INTO ideas (${fields.join(',')},created_by) VALUES (${fields.map(()=>'?').join(',')},?)`).run(...fields.map(f => String(form.get(f)||'')), name);
  redirect('/ideas');
}

export async function addFeedback(form: FormData) {
  const name = (await cookies()).get('user_name')?.value || 'unknown';
  const ideaId = String(form.get('idea_id') || '');
  db.prepare('INSERT INTO feedback (idea_id,user_name,sentiment,viral_score,ease_score,brand_fit_score,originality_score,comment) VALUES (?,?,?,?,?,?,?,?)').run(ideaId, name, form.get('sentiment'), form.get('viral_score'), form.get('ease_score'), form.get('brand_fit_score'), form.get('originality_score'), form.get('comment'));
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(form: FormData) {
  const ideaId = String(form.get('idea_id') || '');
  const status = String(form.get('status') || '');
  const returnTo = String(form.get('return_to') || '/kanban');
  if (!ideaId || !status) redirect(returnTo);
  db.prepare('UPDATE ideas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, ideaId);
  revalidatePath('/kanban');
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${ideaId}`);
  redirect(returnTo);
}

export async function resetWorkspaceData(form: FormData) {
  if (String(form.get('confirm') || '') !== 'RESET') redirect('/settings?error=confirm');
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM comments;
    DELETE FROM ai_generations;
    DELETE FROM images;
    DELETE FROM ideas;
    DELETE FROM apps;
  `);
  revalidatePath('/');
  redirect('/settings?reset=1');
}

export async function runAIBrainstorm(form: FormData) {
  const name = (await cookies()).get('user_name')?.value || 'unknown';
  const appId = String(form.get('app_id') || '');
  const model = String(form.get('model') || '').trim();
  const action = String(form.get('action') || 'Custom Brainstorm');
  const extraPrompt = String(form.get('prompt') || '').trim();
  if (!model) redirect('/ai-brainstorm?error=model');
  const app: any = appId ? db.prepare('select * from apps where id=?').get(appId) : null;
  const brief = app ? Object.entries(app).filter(([k]) => !['id','created_at','updated_at'].includes(k)).map(([k,v]) => `${k}: ${v || ''}`).join('\n') : 'App seçilmedi.';
  const prompt = `Sen AsunaTech IdeaStation içinde çalışan yaratıcı reklam stratejisti ve short-form video fikir partnerisin.\n\nAPP BRIEF:\n${brief}\n\nACTION:\n${action}\n\nUSER PROMPT:\n${extraPrompt || '-'}\n\nCevabı yapılandırılmış ver. Fikirlerde mümkünse Title, Hook, Script, Storyboard, CTA, Why it works, Risks alanlarını kullan.`;
  const response = await chatWithOpenCode({ model, messages: [{ role: 'user', content: prompt }] });
  const result = db.prepare('INSERT INTO ai_generations (app_id,provider,model,action,prompt,response,created_by) VALUES (?,?,?,?,?,?,?)').run(appId || null, 'opencode', model, action, prompt, response, name);
  redirect(`/ai-brainstorm?generation=${result.lastInsertRowid}`);
}
