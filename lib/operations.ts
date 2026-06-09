import { db } from '@/lib/db';
export { hasSensitiveData, mentionedEmails } from '@/lib/text-signals';

export function logError(source: string, error: unknown, actor?: string, metadata?: object) {
  const value = error instanceof Error ? error : new Error(String(error));
  db.prepare('INSERT INTO error_log (source,message,stack,actor,metadata) VALUES (?,?,?,?,?)')
    .run(source, value.message.slice(0, 4000), value.stack?.slice(0, 20000) || null, actor || null, metadata ? JSON.stringify(metadata) : null);
}

export function saveRevision(entityType: 'app' | 'idea', entityId: number, snapshot: object, actor: string) {
  db.prepare('INSERT INTO revisions (entity_type,entity_id,snapshot,changed_by) VALUES (?,?,?,?)')
    .run(entityType, entityId, JSON.stringify(snapshot), actor);
}

export function notify(recipient: string, actor: string, type: string, message: string, href?: string) {
  if (!recipient || recipient === actor) return;
  db.prepare('INSERT INTO notifications (recipient,actor,type,message,href) VALUES (?,?,?,?,?)')
    .run(recipient.toLowerCase(), actor, type, message.slice(0, 500), href || null);
}
