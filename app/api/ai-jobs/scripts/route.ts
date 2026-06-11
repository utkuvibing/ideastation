import { after, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildScriptPrompt, scriptGenerationAction } from '@/lib/brainstorm-prompt';
import { processAIGeneration, recoverInterruptedGenerations, type AIGenerationRow } from '@/lib/ai-jobs';
import { audit } from '@/lib/operations';
import { scriptJobSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await requireRole('editor');
  recoverInterruptedGenerations();
  const body = await request.json().catch(() => null);
  const parsed = scriptJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Kaynak uretim secimi zorunludur.' }, { status: 400 });
  }
  const { parentGenerationId, model, ideaNumbers } = parsed.data;
  const parent = db.prepare('SELECT * FROM ai_generations WHERE id=?').get(parentGenerationId) as AIGenerationRow | undefined;
  if (!parent) return NextResponse.json({ error: 'Kaynak uretim bulunamadi.' }, { status: 404 });
  if (parent.status !== 'completed' || !parent.response) {
    return NextResponse.json({ error: 'Script uretimi icin kaynak uretim tamamlanmis olmali.' }, { status: 400 });
  }
  if (parent.action === 'Improve App Brief') {
    return NextResponse.json({ error: 'Bu uretim turu script uretimine uygun degil.' }, { status: 400 });
  }
  const app = parent.app_id
    ? db.prepare('SELECT * FROM apps WHERE id=? AND deleted_at IS NULL').get(parent.app_id) as Record<string, unknown> | undefined
    : undefined;
  const prompt = buildScriptPrompt(app ?? null, parent.action, parent.response, ideaNumbers);
  const result = db.prepare(`
    INSERT INTO ai_generations
      (app_id,provider,model,action,prompt,response,created_by,status,parent_generation_id)
    VALUES (?,?,?,?,?,'',?,'queued',?)
  `).run(parent.app_id, 'opencode', model || parent.model, scriptGenerationAction, prompt, session.email, parent.id);
  const generationId = Number(result.lastInsertRowid);
  audit(session.email, 'generate', 'ai_generation', generationId, { parentGenerationId: parent.id });
  after(() => processAIGeneration(generationId));
  return NextResponse.json({ generationId, status: 'queued' }, { status: 202 });
}
