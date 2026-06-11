import { db } from '@/lib/db';
import { chatWithOpenCode } from '@/lib/ai';
import { hasSensitiveData, logError } from '@/lib/operations';

export const aiGenerationStatuses = ['queued', 'running', 'completed', 'failed'] as const;
export type AIGenerationStatus = (typeof aiGenerationStatuses)[number];

export type AIGenerationRow = {
  id: number;
  app_id: number | null;
  idea_id: number | null;
  provider: string;
  model: string;
  action: string;
  prompt: string;
  response: string;
  created_by: string;
  created_at: string;
  duration_ms: number | null;
  input_chars: number | null;
  output_chars: number | null;
  estimated_cost_usd: number | null;
  sensitive_data_warning: number;
  status: AIGenerationStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  parent_generation_id: number | null;
};

let interruptedGenerationRecoveryRan = false;

export function recoverInterruptedGenerations() {
  if (interruptedGenerationRecoveryRan) return;
  interruptedGenerationRecoveryRan = true;
  db.prepare(`
    UPDATE ai_generations
    SET status='failed',
      error_message='Sunucu yeniden baslatildigi icin arka plan isi tamamlanamadi.',
      completed_at=CURRENT_TIMESTAMP
    WHERE (status='queued' AND created_at < datetime('now', '-10 minutes'))
      OR (status='running' AND started_at < datetime('now', '-10 minutes'))
  `).run();
}

export async function processAIGeneration(generationId: number) {
  const claim = db.prepare(
    "UPDATE ai_generations SET status='running',started_at=CURRENT_TIMESTAMP WHERE id=? AND status='queued'",
  ).run(generationId);
  if (!claim.changes) return;

  const generation = db.prepare(
    'SELECT id,model,prompt,created_by FROM ai_generations WHERE id=?',
  ).get(generationId) as Pick<AIGenerationRow, 'id' | 'model' | 'prompt' | 'created_by'> | undefined;
  if (!generation) return;
  try {
    const ai = await chatWithOpenCode({
      model: generation.model,
      messages: [{ role: 'user', content: generation.prompt }],
    });
    db.prepare(`
      UPDATE ai_generations SET response=?,duration_ms=?,input_chars=?,output_chars=?,
        estimated_cost_usd=?,sensitive_data_warning=?,status='completed',
        completed_at=CURRENT_TIMESTAMP,error_message=NULL
      WHERE id=? AND status='running'
    `).run(
      ai.text,
      ai.durationMs,
      ai.inputChars,
      ai.outputChars,
      ai.estimatedCostUsd,
      hasSensitiveData(generation.prompt) ? 1 : 0,
      generationId,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen AI hatasi';
    db.prepare(
      "UPDATE ai_generations SET status='failed',error_message=?,completed_at=CURRENT_TIMESTAMP WHERE id=? AND status='running'",
    ).run(message.slice(0, 4000), generationId);
    logError('background_ai_generation', error, generation.created_by, { generationId });
  }
}
