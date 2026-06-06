'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { chatWithOpenCode } from '@/lib/ai';
import { createSession, credentialsAreValid, deleteSession, getSession } from '@/lib/auth';
import { ideaStatuses, type IdeaStatus } from '@/lib/idea-statuses';
import { appFieldLabels } from '@/lib/field-labels';

const statuses = new Set<string>(ideaStatuses.map((status) => status.id));

function requiredText(form: FormData, field: string, maxLength = 200) {
  const value = String(form.get(field) || '').trim();
  if (!value || value.length > maxLength) throw new Error(`${field} is required and must be at most ${maxLength} characters.`);
  return value;
}

async function currentUser() {
  return (await getSession())?.email || 'unknown';
}

export async function login(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  if (!email || !credentialsAreValid(email, password)) redirect('/login?error=1');
  const existingUser = db.prepare('SELECT id FROM users WHERE name = ?').get(email);
  if (existingUser) {
    db.prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE name = ?').run(email);
  } else {
    db.prepare('INSERT INTO users (name, company_name) VALUES (?, ?)').run(email, process.env.COMPANY_NAME || '');
  }
  await createSession(email);
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

export async function createApp(form: FormData) {
  const fields = ['name','category','one_liner','target_audience','main_problem','core_features','unique_selling_points','competitors','brand_tone','content_style','dos','donts','winning_ads','failed_ads','app_store_link','play_store_link','ai_instructions'];
  const values = fields.map(f => f === 'name' ? requiredText(form, f) : String(form.get(f)||'').trim());
  const result = db.prepare(`INSERT INTO apps (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...values);
  redirect(`/ai-brainstorm?app_id=${result.lastInsertRowid}`);
}

export async function createIdea(form: FormData) {
  const name = await currentUser();
  const returnTo = String(form.get('return_to') || '/ideas');
  const fields = ['app_id','title','format','status','description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','ai_score','source','competitor_url','competitor_notes'];
  const values = fields.map(f => f === 'title' ? requiredText(form, f) : String(form.get(f)||'').trim());
  if (!statuses.has(values[3])) throw new Error('Invalid idea status.');
  db.prepare(`INSERT INTO ideas (${fields.join(',')},created_by) VALUES (${fields.map(()=>'?').join(',')},?)`).run(...values, name);
  redirect(returnTo.startsWith('/') ? returnTo : '/ideas');
}

export async function addFeedback(form: FormData) {
  const name = await currentUser();
  const ideaId = requiredText(form, 'idea_id', 20);
  db.prepare('INSERT INTO feedback (idea_id,user_name,sentiment,viral_score,ease_score,brand_fit_score,originality_score,comment) VALUES (?,?,?,?,?,?,?,?)').run(ideaId, name, form.get('sentiment'), form.get('viral_score'), form.get('ease_score'), form.get('brand_fit_score'), form.get('originality_score'), form.get('comment'));
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(form: FormData) {
  const ideaId = String(form.get('idea_id') || '');
  const status = String(form.get('status') || '');
  const returnTo = String(form.get('return_to') || '/kanban');
  if (!ideaId || !statuses.has(status)) redirect(returnTo);
  db.prepare('UPDATE ideas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, ideaId);
  revalidatePath('/kanban');
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${ideaId}`);
  redirect(returnTo);
}

export async function updateIdeaStatusDirect(ideaId: number, status: IdeaStatus) {
  if (!Number.isInteger(ideaId) || ideaId < 1 || !statuses.has(status)) {
    throw new Error('Invalid idea status update.');
  }
  const result = db.prepare(
    'UPDATE ideas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(status, ideaId);
  if (!result.changes) throw new Error('Idea not found.');
  revalidatePath('/kanban');
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${ideaId}`);
}

function validId(form: FormData, field: string) {
  const id = Number(form.get(field));
  if (!Number.isInteger(id) || id < 1) throw new Error(`Invalid ${field}.`);
  return id;
}

const deleteIdeaTransaction = db.transaction((ideaId: number) => {
  db.prepare('DELETE FROM feedback WHERE idea_id = ?').run(ideaId);
  db.prepare('DELETE FROM comments WHERE idea_id = ?').run(ideaId);
  db.prepare('DELETE FROM ai_generations WHERE idea_id = ?').run(ideaId);
  db.prepare("DELETE FROM images WHERE entity_type = 'idea' AND entity_id = ?").run(ideaId);
  return db.prepare('DELETE FROM ideas WHERE id = ?').run(ideaId);
});

export async function deleteIdea(form: FormData) {
  const ideaId = validId(form, 'idea_id');
  const result = deleteIdeaTransaction(ideaId);
  if (!result.changes) throw new Error('Idea not found.');
  revalidatePath('/');
  revalidatePath('/ideas');
  revalidatePath('/kanban');
  redirect('/ideas');
}

const deleteAppTransaction = db.transaction((appId: number) => {
  const ideaIds = db.prepare('SELECT id FROM ideas WHERE app_id = ?').all(appId) as { id: number }[];
  for (const { id } of ideaIds) deleteIdeaTransaction(id);
  db.prepare('DELETE FROM ai_generations WHERE app_id = ?').run(appId);
  db.prepare("DELETE FROM images WHERE entity_type = 'app' AND entity_id = ?").run(appId);
  return db.prepare('DELETE FROM apps WHERE id = ?').run(appId);
});

export async function deleteApp(form: FormData) {
  const appId = validId(form, 'app_id');
  const result = deleteAppTransaction(appId);
  if (!result.changes) throw new Error('App not found.');
  revalidatePath('/');
  revalidatePath('/apps');
  revalidatePath('/ideas');
  revalidatePath('/kanban');
  revalidatePath('/ai-brainstorm');
  redirect('/apps');
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
  const name = await currentUser();
  const appId = String(form.get('app_id') || '');
  const model = String(form.get('model') || '').trim();
  const action = String(form.get('action') || 'Custom Brainstorm');
  const extraPrompt = String(form.get('prompt') || '').trim();
  if (!model) redirect('/ai-brainstorm?error=model');
  const app: any = appId ? db.prepare('select * from apps where id=?').get(appId) : null;
  const brief = app
    ? Object.entries(appFieldLabels).map(([key, label]) => `${label}: ${app[key] || ''}`).join('\n')
    : 'App seçilmedi.';
  const prompt = `Sen AsunaTech IdeaStation içinde çalışan yaratıcı reklam stratejisti ve short-form video fikir partnerisin.\n\nAPP BRIEF:\n${brief}\n\nACTION:\n${action}\n\nUSER PROMPT:\n${extraPrompt || '-'}\n\nCevabı yapılandırılmış ver. Fikirlerde mümkünse Title, Hook, Script, Storyboard, CTA, Why it works, Risks alanlarını kullan.`;
  const response = await chatWithOpenCode({ model, messages: [{ role: 'user', content: prompt }] });
  const result = db.prepare('INSERT INTO ai_generations (app_id,provider,model,action,prompt,response,created_by) VALUES (?,?,?,?,?,?,?)').run(appId || null, 'opencode', model, action, prompt, response, name);
  redirect(`/ai-brainstorm?generation=${result.lastInsertRowid}`);
}

export type BrainstormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  generationId?: number;
  response?: string;
};

export async function runAIBrainstormWithState(
  _previousState: BrainstormState,
  form: FormData,
): Promise<BrainstormState> {
  try {
    const name = await currentUser();
    const appId = String(form.get('app_id') || '');
    const model = String(form.get('model') || '').trim();
    const action = String(form.get('action') || 'Custom Brainstorm');
    const extraPrompt = String(form.get('prompt') || '').trim();
    if (!model) return { status: 'error', message: 'Bir AI modeli seçmelisin.' };
    const app: any = appId ? db.prepare('select * from apps where id=?').get(appId) : null;
    if (appId && !app) return { status: 'error', message: 'Seçilen app bulunamadı.' };
    const brief = app
      ? Object.entries(appFieldLabels).map(([key, label]) => `${label}: ${app[key] || ''}`).join('\n')
      : 'App seçilmedi.';
    const prompt = `Sen IdeaStation içinde çalışan yaratıcı reklam stratejisti ve short-form video fikir partnerisin.\n\nAPP BRIEF:\n${brief}\n\nACTION:\n${action}\n\nUSER PROMPT:\n${extraPrompt || '-'}\n\nCevabı yapılandırılmış ver. Fikirlerde mümkünse Title, Hook, Script, Storyboard, CTA, Why it works, Risks alanlarını kullan.`;
    const response = await chatWithOpenCode({ model, messages: [{ role: 'user', content: prompt }] });
    const result = db.prepare(
      'INSERT INTO ai_generations (app_id,provider,model,action,prompt,response,created_by) VALUES (?,?,?,?,?,?,?)',
    ).run(appId || null, 'opencode', model, action, prompt, response, name);
    const generationId = Number(result.lastInsertRowid);
    revalidatePath('/ai-brainstorm');
    return {
      status: 'success',
      message: 'Brainstorm tamamlandı ve geçmişe kaydedildi.',
      generationId,
      response,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Brainstorm sırasında bilinmeyen bir hata oluştu.',
    };
  }
}
