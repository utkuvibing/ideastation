import { db } from '@/lib/db';
import { chatWithOpenCode } from '@/lib/ai';
import { hasSensitiveData, logError } from '@/lib/operations';

export async function processAIGeneration(generationId: number) {
  const generation = db.prepare(
    "SELECT id,model,prompt,created_by FROM ai_generations WHERE id=? AND status='queued'",
  ).get(generationId) as { id: number; model: string; prompt: string; created_by: string } | undefined;
  if (!generation) return;

  db.prepare("UPDATE ai_generations SET status='running',started_at=CURRENT_TIMESTAMP WHERE id=?").run(generationId);
  try {
    const ai = await chatWithOpenCode({
      model: generation.model,
      messages: [{ role: 'user', content: generation.prompt }],
    });
    db.prepare(`
      UPDATE ai_generations SET response=?,duration_ms=?,input_chars=?,output_chars=?,
        estimated_cost_usd=?,sensitive_data_warning=?,status='completed',
        completed_at=CURRENT_TIMESTAMP,error_message=NULL
      WHERE id=?
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
      "UPDATE ai_generations SET status='failed',error_message=?,completed_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(message.slice(0, 4000), generationId);
    logError('background_ai_generation', error, generation.created_by, { generationId });
  }
}
