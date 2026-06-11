'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIGenerationStatus } from '@/lib/ai-jobs';

type Job = {
  id: number;
  action: string;
  status: AIGenerationStatus;
  error_message?: string | null;
};

function isActiveStatus(status: AIGenerationStatus) {
  return status === 'queued' || status === 'running';
}

function isFinishedStatus(status: AIGenerationStatus) {
  return status === 'completed' || status === 'failed';
}

export function AIJobToasts() {
  const [toasts, setToasts] = useState<Job[]>([]);
  const previousStatuses = useRef<Map<number, AIGenerationStatus>>(new Map());
  const hasSnapshot = useRef(false);

  const poll = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-jobs', { cache: 'no-store' });
      if (!response.ok) return;
      const { jobs } = await response.json() as { jobs: Job[] };
      const finished = hasSnapshot.current
        ? jobs.filter((job) => {
            const previousStatus = previousStatuses.current.get(job.id);
            return isFinishedStatus(job.status) && Boolean(previousStatus && isActiveStatus(previousStatus));
          })
        : [];
      previousStatuses.current = new Map(jobs.map((job) => [job.id, job.status]));
      hasSnapshot.current = true;
      if (finished.length) setToasts((current) => [...finished, ...current.filter((item) => !finished.some((job) => job.id === item.id))].slice(0, 3));
    } catch {
      // A temporary polling failure should not interrupt navigation.
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = window.setInterval(poll, 3000);
    return () => window.clearInterval(interval);
  }, [poll]);

  function dismiss(job: Job) {
    setToasts((items) => items.filter((item) => item.id !== job.id));
  }

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {toasts.map((job) => (
        <section key={job.id} role="status" className={`card border-l-4 shadow-xl ${job.status === 'failed' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
          <h2 className="text-sm font-semibold">{job.status === 'failed' ? 'AI fikir üretimi başarısız' : 'AI fikirleri hazır'}</h2>
          <p className="muted mt-1 text-sm">{job.status === 'failed' ? job.error_message || 'Bilinmeyen bir hata oluştu.' : `${job.action} tamamlandı.`}</p>
          <div className="mt-3 flex gap-2">
            <Link className="btn btn-sm" href={`/ai-brainstorm?generation=${job.id}`} onClick={() => dismiss(job)}>
              {job.status === 'failed' ? 'Detayı gör' : 'Fikri gör'}
            </Link>
            <button type="button" className="btn-ghost btn-sm" onClick={() => dismiss(job)}>Kapat</button>
          </div>
        </section>
      ))}
    </div>
  );
}
