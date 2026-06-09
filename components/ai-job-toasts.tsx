'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Job = {
  id: number;
  action: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error_message?: string | null;
};

export function AIJobToasts() {
  const [toasts, setToasts] = useState<Job[]>([]);

  const poll = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-jobs', { cache: 'no-store' });
      if (!response.ok) return;
      const { jobs } = await response.json() as { jobs: Job[] };
      const active = new Set<number>(JSON.parse(localStorage.getItem('ideastation_active_ai_jobs') || '[]'));
      for (const job of jobs) {
        if (job.status === 'queued' || job.status === 'running') active.add(job.id);
      }
      localStorage.setItem('ideastation_active_ai_jobs', JSON.stringify([...active].slice(-100)));
      const finished = jobs.filter((job) => ['completed', 'failed'].includes(job.status) && active.has(job.id));
      if (finished.length) setToasts((current) => [...finished, ...current.filter((item) => !finished.some((job) => job.id === item.id))].slice(0, 3));
    } catch {
      // A temporary polling failure should not interrupt navigation.
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = window.setInterval(poll, 3000);
    const started = () => poll();
    window.addEventListener('ideastation:ai-job-started', started);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('ideastation:ai-job-started', started);
    };
  }, [poll]);

  function dismiss(job: Job) {
    const active = new Set<number>(JSON.parse(localStorage.getItem('ideastation_active_ai_jobs') || '[]'));
    active.delete(job.id);
    localStorage.setItem('ideastation_active_ai_jobs', JSON.stringify([...active]));
    setToasts((items) => items.filter((item) => item.id !== job.id));
  }

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {toasts.map((job) => (
        <section key={`${job.id}:${job.status}`} className={`card shadow-xl ${job.status === 'failed' ? 'border-red-500/50' : 'border-green-500/50'}`}>
          <h2 className="font-bold">{job.status === 'failed' ? 'AI fikir uretimi basarisiz' : 'AI fikirleri hazir'}</h2>
          <p className="mt-1 text-sm">{job.status === 'failed' ? job.error_message || 'Bilinmeyen bir hata olustu.' : `${job.action} tamamlandi.`}</p>
          <div className="mt-3 flex gap-2">
            <Link className="btn" href={`/ai-brainstorm?generation=${job.id}`} onClick={() => dismiss(job)}>
              {job.status === 'failed' ? 'Detayi gor' : 'Fikri gor'}
            </Link>
            <button type="button" onClick={() => dismiss(job)}>Tamam</button>
          </div>
        </section>
      ))}
    </div>
  );
}
