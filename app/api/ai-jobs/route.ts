import { after, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildBrainstormPrompt } from '@/lib/brainstorm-prompt';
import { processAIGeneration, recoverInterruptedGenerations, type AIGenerationRow } from '@/lib/ai-jobs';
import { audit } from '@/lib/operations';
import { brainstormJobSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await requireRole('editor');
  recoverInterruptedGenerations();
  const body = await request.json().catch(() => null);
  const parsed = brainstormJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'App ve model secimi zorunludur.' }, { status: 400 });
  }
  const { appId, model, action, prompt: extraPrompt } = parsed.data;
  const app = db.prepare('SELECT * FROM apps WHERE id=? AND deleted_at IS NULL').get(appId) as Record<string, unknown> | undefined;
  if (!app) return NextResponse.json({ error: 'App bulunamadi.' }, { status: 404 });
  const prompt = buildBrainstormPrompt(app, action, extraPrompt);
  const result = db.prepare(`
    INSERT INTO ai_generations
      (app_id,provider,model,action,prompt,response,created_by,status)
    VALUES (?,?,?,?,?,'',?,'queued')
  `).run(appId, 'opencode', model, action, prompt, session.email);
  const generationId = Number(result.lastInsertRowid);
  audit(session.email, 'generate', 'ai_generation', generationId);
  after(() => processAIGeneration(generationId));
  return NextResponse.json({ generationId, status: 'queued' }, { status: 202 });
}

export async function GET() {
  const session = await requireRole('viewer');
  recoverInterruptedGenerations();
  const jobs = db.prepare(`
    SELECT id,action,status,error_message,created_at,completed_at
    FROM ai_generations
    WHERE created_by=?
    ORDER BY id DESC LIMIT 20
  `).all(session.email) as Pick<AIGenerationRow, 'id' | 'action' | 'status' | 'error_message' | 'created_at' | 'completed_at'>[];
  return NextResponse.json({ jobs });
}
