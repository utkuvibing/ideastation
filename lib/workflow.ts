import type { IdeaStatus } from '@/lib/idea-statuses';

const transitions: Record<IdeaStatus, readonly IdeaStatus[]> = {
  draft: ['needs_feedback', 'archived'],
  needs_feedback: ['approved', 'rejected', 'draft'],
  approved: ['needs_script', 'ready_to_shoot', 'needs_feedback'],
  needs_script: ['ready_to_shoot', 'needs_feedback'],
  ready_to_shoot: ['shooting', 'needs_script'],
  shooting: ['shot', 'ready_to_shoot'],
  shot: ['editing', 'shooting'],
  editing: ['published', 'shot'],
  published: ['archived'],
  rejected: ['draft', 'archived'],
  archived: ['draft'],
};

export function canTransition(from: IdeaStatus, to: IdeaStatus) {
  return from === to || transitions[from].includes(to);
}

export function transitionRequiresReviewer(to: IdeaStatus) {
  return to === 'approved' || to === 'rejected';
}

export function normalizeIdeaText(value: string) {
  return value.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((token) => token.length > 2);
}

export function ideaSimilarity(left: string, right: string) {
  const a = new Set(normalizeIdeaText(left));
  const b = new Set(normalizeIdeaText(right));
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}
