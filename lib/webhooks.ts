import { db } from '@/lib/db';
import { logError } from '@/lib/operations';

export async function sendWorkflowWebhooks(event: string, message: string, href?: string) {
  const targets = [
    { provider: 'slack', url: process.env.SLACK_WEBHOOK_URL },
    { provider: 'teams', url: process.env.TEAMS_WEBHOOK_URL },
  ].filter((target): target is { provider: string; url: string } => Boolean(target.url));

  await Promise.all(targets.map(async (target) => {
    try {
      const body = target.provider === 'slack'
        ? { text: `${message}${href ? `\n${href}` : ''}` }
        : { type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: { type: 'AdaptiveCard', version: '1.4', body: [{ type: 'TextBlock', text: message, wrap: true }, ...(href ? [{ type: 'TextBlock', text: href, wrap: true }] : [])] } }] };
      const response = await fetch(target.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
      db.prepare('INSERT INTO webhook_deliveries(provider,event,target,ok,status_code,error) VALUES (?,?,?,?,?,?)').run(target.provider, event, new URL(target.url).host, response.ok ? 1 : 0, response.status, response.ok ? null : (await response.text()).slice(0, 1000));
    } catch (error) {
      logError('webhook', error, undefined, { provider: target.provider, event });
      db.prepare('INSERT INTO webhook_deliveries(provider,event,target,ok,error) VALUES (?,?,?,?,?)').run(target.provider, event, 'configured', 0, error instanceof Error ? error.message : String(error));
    }
  }));
}
