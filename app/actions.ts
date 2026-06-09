'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { chatWithOpenCode } from '@/lib/ai';
import { createSession, credentialsAreValid, deleteSession, requireRole } from '@/lib/auth';
import { ideaStatuses, type IdeaStatus } from '@/lib/idea-statuses';
import { appSchema, feedbackSchema, formObject, ideaSchema, performanceSchema } from '@/lib/validation';
import { hasSensitiveData, logError, mentionedEmails, notify, saveRevision } from '@/lib/operations';
import { canTransition, transitionRequiresReviewer } from '@/lib/workflow';
import { sendWorkflowWebhooks } from '@/lib/webhooks';
import { buildBrainstormPrompt } from '@/lib/brainstorm-prompt';

const statuses = new Set<string>(ideaStatuses.map((status) => status.id));

function requiredText(form: FormData, field: string, maxLength = 200) {
  const value = String(form.get(field) || '').trim();
  if (!value || value.length > maxLength) throw new Error(`${field} is required and must be at most ${maxLength} characters.`);
  return value;
}

function audit(actor: string, action: string, entityType: string, entityId?: number | bigint, metadata?: object) {
  db.prepare(
    'INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
  ).run(actor, action, entityType, entityId ? Number(entityId) : null, metadata ? JSON.stringify(metadata) : null);
}

export async function login(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  const user = email ? credentialsAreValid(email, password) : null;
  if (!user) redirect('/login?error=1');
  const existingUser = db.prepare('SELECT id FROM users WHERE name = ?').get(email);
  if (existingUser) {
    db.prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE name = ?').run(email);
  } else {
    db.prepare('INSERT INTO users (name, company_name) VALUES (?, ?)').run(email, process.env.COMPANY_NAME || '');
  }
  await createSession(email, user.role);
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

export async function createApp(form: FormData) {
  const session = await requireRole('editor');
  const fields = ['name','category','one_liner','target_audience','main_problem','core_features','unique_selling_points','competitors','brand_tone','content_style','dos','donts','winning_ads','failed_ads','app_store_link','play_store_link','ai_instructions'];
  const parsed = appSchema.parse(formObject(form, fields));
  const values = fields.map((field) => parsed[field as keyof typeof parsed]);
  const result = db.prepare(`INSERT INTO apps (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...values);
  audit(session.email, 'create', 'app', result.lastInsertRowid);
  redirect(`/ai-brainstorm?app_id=${result.lastInsertRowid}`);
}

export async function createIdea(form: FormData) {
  const session = await requireRole('editor');
  const returnTo = String(form.get('return_to') || '/ideas');
  const fields = ['app_id','title','format','status','description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','ai_score','source','competitor_url','competitor_notes','owner','team','deadline','priority','tags','campaign','channel','country','language'];
  const parsed = ideaSchema.parse(formObject(form, fields));
  const values = fields.map((field) => parsed[field as keyof typeof parsed] === '' ? null : parsed[field as keyof typeof parsed]);
  const result = db.prepare(`INSERT INTO ideas (${fields.join(',')},created_by) VALUES (${fields.map(()=>'?').join(',')},?)`).run(...values, session.email);
  audit(session.email, 'create', 'idea', result.lastInsertRowid);
  if (parsed.owner) notify(parsed.owner, session.email, 'assignment', `${parsed.title} fikri size atandi.`, `/ideas/${result.lastInsertRowid}`);
  redirect(returnTo.startsWith('/') ? returnTo : '/ideas');
}

export async function updateApp(form: FormData) {
  const session = await requireRole('editor');
  const appId = validId(form, 'app_id');
  const fields = ['name','category','one_liner','target_audience','main_problem','core_features','unique_selling_points','competitors','brand_tone','content_style','dos','donts','winning_ads','failed_ads','app_store_link','play_store_link','ai_instructions'];
  const parsed = appSchema.parse(formObject(form, fields));
  const previous = db.prepare('SELECT * FROM apps WHERE id=? AND deleted_at IS NULL').get(appId) as object | undefined;
  if (!previous) throw new Error('App not found.');
  saveRevision('app', appId, previous, session.email);
  db.prepare(`UPDATE apps SET ${fields.map((field) => `${field}=?`).join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(...fields.map((field) => parsed[field as keyof typeof parsed]), appId);
  audit(session.email, 'update', 'app', appId);
  revalidatePath(`/apps/${appId}`);
  redirect(`/apps/${appId}`);
}

export async function updateIdea(form: FormData) {
  const session = await requireRole('editor');
  const ideaId = validId(form, 'idea_id');
  const fields = ['app_id','title','format','status','description','hook','script','storyboard','visual_notes','voiceover','caption','cta','hashtags','why_it_might_work','risks','production_difficulty','ai_score','source','competitor_url','competitor_notes','owner','team','deadline','priority','tags','campaign','channel','country','language'];
  const parsed = ideaSchema.parse(formObject(form, fields));
  const previous = db.prepare('SELECT * FROM ideas WHERE id=? AND deleted_at IS NULL').get(ideaId) as Record<string, unknown> | undefined;
  if (!previous) throw new Error('Idea not found.');
  if (!canTransition(previous.status as IdeaStatus, parsed.status as IdeaStatus)) throw new Error('Bu durum gecisi izinli degil.');
  if (transitionRequiresReviewer(parsed.status as IdeaStatus)) await requireRole('reviewer');
  saveRevision('idea', ideaId, previous, session.email);
  db.prepare(`UPDATE ideas SET ${fields.map((field) => `${field}=?`).join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(...fields.map((field) => parsed[field as keyof typeof parsed] === '' ? null : parsed[field as keyof typeof parsed]), ideaId);
  if (parsed.owner && parsed.owner !== previous.owner) notify(parsed.owner, session.email, 'assignment', `${parsed.title} fikri size atandi.`, `/ideas/${ideaId}`);
  audit(session.email, 'update', 'idea', ideaId);
  if (parsed.status !== previous.status) await sendWorkflowWebhooks('status_changed', `${parsed.title}: ${previous.status} -> ${parsed.status}`, `/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function addComment(form: FormData) {
  const session = await requireRole('reviewer');
  const ideaId = validId(form, 'idea_id');
  const body = requiredText(form, 'body', 10000);
  db.prepare('INSERT INTO comments (idea_id,user_name,body) VALUES (?,?,?)').run(ideaId, session.email, body);
  for (const email of mentionedEmails(body)) notify(email, session.email, 'mention', `${session.email} sizi bir yorumda andi.`, `/ideas/${ideaId}`);
  audit(session.email, 'comment', 'idea', ideaId);
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function markNotificationsRead() {
  const session = await requireRole('viewer');
  db.prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE recipient=? AND read_at IS NULL').run(session.email);
  revalidatePath('/notifications');
}

export async function restoreEntity(form: FormData) {
  const session = await requireRole('admin');
  const entityType = String(form.get('entity_type'));
  const id = validId(form, 'entity_id');
  if (!['app', 'idea'].includes(entityType)) throw new Error('Invalid entity type.');
  const table = entityType === 'app' ? 'apps' : 'ideas';
  db.prepare(`UPDATE ${table} SET deleted_at=NULL, deleted_by=NULL WHERE id=?`).run(id);
  audit(session.email, 'restore', entityType, id);
  revalidatePath('/settings/trash');
}

export async function addFeedback(form: FormData) {
  const session = await requireRole('reviewer');
  const fields = ['idea_id', 'sentiment', 'viral_score', 'ease_score', 'brand_fit_score', 'originality_score', 'comment'];
  const parsed = feedbackSchema.parse(formObject(form, fields));
  db.prepare('INSERT INTO feedback (idea_id,user_name,sentiment,viral_score,ease_score,brand_fit_score,originality_score,comment) VALUES (?,?,?,?,?,?,?,?)').run(parsed.idea_id, session.email, parsed.sentiment, parsed.viral_score, parsed.ease_score, parsed.brand_fit_score, parsed.originality_score, parsed.comment);
  audit(session.email, 'create', 'feedback', undefined, { ideaId: parsed.idea_id });
  const ideaId = parsed.idea_id;
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(form: FormData) {
  const ideaId = String(form.get('idea_id') || '');
  const status = String(form.get('status') || '');
  const returnTo = String(form.get('return_to') || '/kanban');
  if (!ideaId || !statuses.has(status)) redirect(returnTo);
  await updateIdeaStatusDirect(Number(ideaId), status as IdeaStatus);
  revalidatePath('/kanban');
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${ideaId}`);
  redirect(returnTo);
}

export async function updateIdeaStatusDirect(ideaId: number, status: IdeaStatus) {
  let session = await requireRole('editor');
  if (!Number.isInteger(ideaId) || ideaId < 1 || !statuses.has(status)) {
    throw new Error('Invalid idea status update.');
  }
  const idea = db.prepare('SELECT id,title,status,owner FROM ideas WHERE id=? AND deleted_at IS NULL').get(ideaId) as {id:number;title:string;status:IdeaStatus;owner?:string} | undefined;
  if (!idea) throw new Error('Idea not found.');
  if (!canTransition(idea.status, status)) throw new Error('Bu durum gecisi izinli degil.');
  if (transitionRequiresReviewer(status)) session = await requireRole('reviewer');
  const approved = status === 'approved';
  const result = db.prepare('UPDATE ideas SET status=?, approved_by=?, approved_at=?, rejection_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, approved ? session.email : null, approved ? new Date().toISOString() : null, status === 'rejected' ? 'Workflow rejection' : null, ideaId);
  if (!result.changes) throw new Error('Idea not found.');
  audit(session.email, 'status_update', 'idea', ideaId, { status });
  if (idea.owner) notify(idea.owner, session.email, 'status', `${idea.title} durumu ${status} oldu.`, `/ideas/${ideaId}`);
  await sendWorkflowWebhooks('status_changed', `${idea.title}: ${idea.status} -> ${status}`, `/ideas/${ideaId}`);
  revalidatePath('/kanban');
  revalidatePath('/ideas');
  revalidatePath(`/ideas/${ideaId}`);
}

export async function addPerformanceMetric(form: FormData) {
  const session = await requireRole('editor');
  const fields = ['idea_id','platform','report_date','spend','impressions','views','clicks','installs','conversions','revenue'];
  const parsed = performanceSchema.parse(formObject(form, fields));
  const idea = db.prepare("SELECT title,status FROM ideas WHERE id=? AND deleted_at IS NULL").get(parsed.idea_id) as {title:string;status:IdeaStatus} | undefined;
  if (!idea) throw new Error('Idea not found.');
  if (idea.status !== 'published') throw new Error('Performans metrigi sadece published fikirler icin eklenebilir.');
  db.prepare('INSERT INTO performance_metrics (idea_id,platform,report_date,spend,impressions,views,clicks,installs,conversions,revenue,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(parsed.idea_id, parsed.platform, parsed.report_date, parsed.spend, parsed.impressions, parsed.views, parsed.clicks, parsed.installs, parsed.conversions, parsed.revenue, session.email);
  audit(session.email, 'metric_create', 'idea', parsed.idea_id, { platform: parsed.platform });
  revalidatePath(`/ideas/${parsed.idea_id}`);
  revalidatePath('/reports');
  redirect(`/ideas/${parsed.idea_id}`);
}

function validId(form: FormData, field: string) {
  const id = Number(form.get(field));
  if (!Number.isInteger(id) || id < 1) throw new Error(`Invalid ${field}.`);
  return id;
}

export async function deleteIdea(form: FormData) {
  const session = await requireRole('admin');
  const ideaId = validId(form, 'idea_id');
  const result = db.prepare('UPDATE ideas SET deleted_at=CURRENT_TIMESTAMP, deleted_by=? WHERE id=? AND deleted_at IS NULL').run(session.email, ideaId);
  if (!result.changes) throw new Error('Idea not found.');
  audit(session.email, 'delete', 'idea', ideaId);
  revalidatePath('/');
  revalidatePath('/ideas');
  revalidatePath('/kanban');
  redirect('/ideas');
}

export async function deleteApp(form: FormData) {
  const session = await requireRole('admin');
  const appId = validId(form, 'app_id');
  const result = db.prepare('UPDATE apps SET deleted_at=CURRENT_TIMESTAMP, deleted_by=? WHERE id=? AND deleted_at IS NULL').run(session.email, appId);
  db.prepare('UPDATE ideas SET deleted_at=CURRENT_TIMESTAMP, deleted_by=? WHERE app_id=? AND deleted_at IS NULL').run(session.email, appId);
  if (!result.changes) throw new Error('App not found.');
  audit(session.email, 'delete', 'app', appId);
  revalidatePath('/');
  revalidatePath('/apps');
  revalidatePath('/ideas');
  revalidatePath('/kanban');
  revalidatePath('/ai-brainstorm');
  redirect('/apps');
}

export async function createIdeaFromGeneration(form: FormData) {
  const session = await requireRole('editor');
  const generationId = validId(form, 'generation_id');
  const generation = db.prepare('SELECT * FROM ai_generations WHERE id=?').get(generationId) as { app_id: number; response: string; action: string } | undefined;
  if (!generation?.app_id) throw new Error('Generation or app not found.');
  const title = String(form.get('title') || generation.action).trim().slice(0, 200);
  const result = db.prepare("INSERT INTO ideas (app_id,title,status,description,source,created_by) VALUES (?,?,'draft',?,'ai',?)")
    .run(generation.app_id, title, generation.response, session.email);
  db.prepare('UPDATE ai_generations SET idea_id=? WHERE id=?').run(result.lastInsertRowid, generationId);
  audit(session.email, 'convert', 'ai_generation', generationId, { ideaId: Number(result.lastInsertRowid) });
  redirect(`/ideas/${result.lastInsertRowid}`);
}

export async function resetWorkspaceData(form: FormData) {
  const session = await requireRole('admin');
  if (String(form.get('confirm') || '') !== 'RESET') redirect('/settings?error=confirm');
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM comments;
    DELETE FROM ai_generations;
    DELETE FROM images;
    DELETE FROM ideas;
    DELETE FROM apps;
  `);
  audit(session.email, 'reset', 'workspace');
  revalidatePath('/');
  redirect('/settings?reset=1');
}

export async function runAIBrainstorm(form: FormData) {
  const session = await requireRole('editor');
  const appId = String(form.get('app_id') || '');
  const model = String(form.get('model') || '').trim();
  const action = String(form.get('action') || 'Custom Brainstorm');
  const extraPrompt = String(form.get('prompt') || '').trim().slice(0, 20000);
  if (!model) redirect('/ai-brainstorm?error=model');
  const app: any = appId ? db.prepare('select * from apps where id=?').get(appId) : null;
  const prompt = buildBrainstormPrompt(app, action, extraPrompt);
  const ai = await chatWithOpenCode({ model, messages: [{ role: 'user', content: prompt }] });
  const result = db.prepare('INSERT INTO ai_generations (app_id,provider,model,action,prompt,response,created_by,duration_ms,input_chars,output_chars,estimated_cost_usd,sensitive_data_warning) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(appId || null, 'opencode', model, action, prompt, ai.text, session.email, ai.durationMs, ai.inputChars, ai.outputChars, ai.estimatedCostUsd, hasSensitiveData(prompt) ? 1 : 0);
  audit(session.email, 'generate', 'ai_generation', result.lastInsertRowid);
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
    const session = await requireRole('editor');
    const appId = String(form.get('app_id') || '');
    const model = String(form.get('model') || '').trim();
    const action = String(form.get('action') || 'Custom Brainstorm');
    const extraPrompt = String(form.get('prompt') || '').trim().slice(0, 20000);
    if (!model) return { status: 'error', message: 'Bir AI modeli seçmelisin.' };
    const app: any = appId ? db.prepare('select * from apps where id=?').get(appId) : null;
    if (appId && !app) return { status: 'error', message: 'Seçilen app bulunamadı.' };
    const prompt = buildBrainstormPrompt(app, action, extraPrompt);
    const ai = await chatWithOpenCode({ model, messages: [{ role: 'user', content: prompt }] });
    const result = db.prepare(
      'INSERT INTO ai_generations (app_id,provider,model,action,prompt,response,created_by,duration_ms,input_chars,output_chars,estimated_cost_usd,sensitive_data_warning) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    ).run(appId || null, 'opencode', model, action, prompt, ai.text, session.email, ai.durationMs, ai.inputChars, ai.outputChars, ai.estimatedCostUsd, hasSensitiveData(prompt) ? 1 : 0);
    const generationId = Number(result.lastInsertRowid);
    audit(session.email, 'generate', 'ai_generation', generationId);
    revalidatePath('/ai-brainstorm');
    return {
      status: 'success',
      message: 'Brainstorm tamamlandı ve geçmişe kaydedildi.',
      generationId,
      response: ai.text,
    };
  } catch (error) {
    logError('ai_brainstorm', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Brainstorm sırasında bilinmeyen bir hata oluştu.',
    };
  }
}
