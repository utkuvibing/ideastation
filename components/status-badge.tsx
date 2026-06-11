import { ideaStatuses, type IdeaStatus } from '@/lib/idea-statuses';

const statusStyles: Record<IdeaStatus, string> = {
  draft: 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-300',
  needs_feedback: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  needs_script: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  ready_to_shoot: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300',
  shooting: 'bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  shot: 'bg-fuchsia-500/10 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300',
  editing: 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  published: 'bg-green-500/10 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  rejected: 'bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  archived: 'bg-zinc-500/10 text-zinc-500 dark:bg-zinc-400/10 dark:text-zinc-400',
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const meta = ideaStatuses.find((item) => item.id === status);
  const style = meta ? statusStyles[meta.id] : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300';
  return <span className={`badge ${style}`}>{meta?.label ?? status}</span>;
}
