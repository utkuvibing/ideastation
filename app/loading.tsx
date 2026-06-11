export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Sayfa yükleniyor" className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />)}
      </div>
      <div className="h-64 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
