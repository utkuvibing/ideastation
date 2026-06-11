import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default function Reports() {
  const rows = db.prepare(`SELECT apps.name app_name,COALESCE(ideas.team,'Unassigned') team,COALESCE(ideas.campaign,'No campaign') campaign,COALESCE(ideas.channel,'No channel') channel,COUNT(DISTINCT ideas.id) ideas,COALESCE(SUM(pm.spend),0) spend,COALESCE(SUM(pm.views),0) views,COALESCE(SUM(pm.clicks),0) clicks,COALESCE(SUM(pm.installs),0) installs,COALESCE(SUM(pm.revenue),0) revenue FROM ideas JOIN apps ON apps.id=ideas.app_id LEFT JOIN performance_metrics pm ON pm.idea_id=ideas.id WHERE ideas.deleted_at IS NULL GROUP BY apps.name,ideas.team,ideas.campaign,ideas.channel ORDER BY revenue DESC,views DESC`).all() as Record<string,any>[];
  const numeric = 'text-right tabular-nums';
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="page-subtitle">App, takım, kampanya ve kanal kırılımında performans özeti.</p>
      </header>
      <section className="card overflow-x-auto p-0 sm:p-0">
        {!rows.length ? (
          <div className="py-12 text-center">
            <h2 className="font-semibold">Henüz rapor verisi yok</h2>
            <p className="muted mt-1 text-sm">Fikirlere performans metriği eklendiğinde burada görünür.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                {['App','Team','Campaign','Channel'].map(x=><th key={x}>{x}</th>)}
                {['Ideas','Spend','Views','Clicks','Installs','Revenue','CTR','CPI','ROAS'].map(x=><th className="text-right" key={x}>{x}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td className="font-medium">{r.app_name}</td><td>{r.team}</td><td>{r.campaign}</td><td>{r.channel}</td>
                  <td className={numeric}>{r.ideas}</td>
                  <td className={numeric}>{r.spend.toFixed(2)}</td>
                  <td className={numeric}>{r.views}</td>
                  <td className={numeric}>{r.clicks}</td>
                  <td className={numeric}>{r.installs}</td>
                  <td className={numeric}>{r.revenue.toFixed(2)}</td>
                  <td className={numeric}>{r.views?`${(r.clicks/r.views*100).toFixed(2)}%`:'-'}</td>
                  <td className={numeric}>{r.installs?(r.spend/r.installs).toFixed(2):'-'}</td>
                  <td className={numeric}>{r.spend?(r.revenue/r.spend).toFixed(2):'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
