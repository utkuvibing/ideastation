import { after, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildBrainstormPrompt } from '@/lib/brainstorm-prompt';
import { processAIGeneration } from '@/lib/ai-jobs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await requireRole('editor');
  const body = await request.json() as { appId?: string; model?: string; action?: string; prompt?: string };
  const appId = Number(body.appId);
  const model = String(body.model || '').trim();
  const action = String(body.action || 'Custom Brainstorm').trim();
  const extraPrompt = String(body.prompt || '').trim().slice(0, 20000);
  if (!Number.isInteger(appId) || appId < 1 || !model) {
    return NextResponse.json({ error: 'App ve model secimi zorunludur.' }, { status: 400 });
  }
  const app = db.prepare('SELECT * FROM apps WHERE id=? AND deleted_at IS NULL').get(appId) as Record<string, unknown> | undefined;
  if (!app) return NextResponse.json({ error: 'App bulunamadi.' }, { status: 404 });
  const prompt = buildBrainstormPrompt(app, action, extraPrompt);
  const result = db.prepare(`
    INSERT INTO ai_generations
      (app_id,provider,model,action,prompt,response,created_by,status)
    VALUES (?,?,?,?,?,'',?,'queued')
  `).run(appId, 'opencode', model, action, prompt, session.email);
  const generationId = Number(result.lastInsertRowid);
  after(() => processAIGeneration(generationId));
  return NextResponse.json({ generationId, status: 'queued' }, { status: 202 });
}

export async function GET() {
  const session = await requireRole('viewer');
  const jobs = db.prepare(`
    SELECT id,action,status,error_message,created_at,completed_at
    FROM ai_generations
    WHERE created_by=? AND status IN ('queued','running','completed','failed')
    ORDER BY id DESC LIMIT 20
  `).all(session.email);
  return NextResponse.json({ jobs });
}
