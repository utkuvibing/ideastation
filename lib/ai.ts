export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ModelOption = { id: string; label: string };

function getBaseUrl() {
  return (process.env.OPENCODE_BASE_URL || 'http://localhost:4096').replace(/\/$/, '');
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  // OpenCode server uses HTTP Basic Auth when OPENCODE_SERVER_PASSWORD is set.
  const user = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
  const pass = process.env.OPENCODE_SERVER_PASSWORD || process.env.OPENCODE_API_KEY || '';
  if (pass) headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  return headers;
}

async function fetchJson(path: string, init?: RequestInit) {
  const baseUrl = getBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) }, cache: 'no-store' });
  } catch {
    throw new Error(`${baseUrl}${path} erişilemiyor. Terminalde "opencode serve --port 4096" çalışıyor mu?`);
  }
  if (!res.ok) throw new Error(`${path} başarısız: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export async function listOpenCodeModels(): Promise<ModelOption[]> {
  const json = await fetchJson('/config/providers');
  const providers = json.providers || json.all || [];
  const defaults = json.default || {};
  const out: ModelOption[] = [];
  for (const p of providers) {
    const providerID = p.id || p.providerID || p.name;
    const models = p.models || p.model || [];
    if (Array.isArray(models)) {
      for (const m of models) {
        const modelID = typeof m === 'string' ? m : (m.id || m.modelID || m.name);
        if (providerID && modelID) out.push({ id: `${providerID}:${modelID}`, label: `${providerID} / ${modelID}` });
      }
    } else if (typeof models === 'object') {
      for (const modelID of Object.keys(models)) out.push({ id: `${providerID}:${modelID}`, label: `${providerID} / ${modelID}` });
    }
    if (providerID && defaults[providerID]) out.push({ id: `${providerID}:${defaults[providerID]}`, label: `${providerID} / ${defaults[providerID]} (default)` });
  }
  return Array.from(new Map(out.map(x => [x.id, x])).values());
}

function normalizeModel(model: string) {
  const [providerID, ...rest] = model.split(':');
  const modelID = rest.join(':');
  if (!providerID || !modelID) throw new Error('Model formatı provider:modelID olmalı. Örn: anthropic:claude-sonnet-4-5');
  return { providerID, modelID };
}

export async function chatWithOpenCode(input: { model: string; messages: ChatMessage[]; temperature?: number; maxTokens?: number }) {
  const { providerID, modelID } = normalizeModel(input.model);
  const session = await fetchJson('/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'IdeaStation Brainstorm' }),
  });
  const sessionID = session.id || session.sessionID;
  if (!sessionID) throw new Error('OpenCode session oluşturuldu ama id dönmedi.');
  const content = input.messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
  const result = await fetchJson(`/session/${sessionID}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: { providerID, modelID },
      parts: [{ type: 'text', text: content }],
    }),
  });
  const parts = result.parts || [];
  const text = parts.map((p: any) => p.text || p.content || '').filter(Boolean).join('\n');
  return text || JSON.stringify(result, null, 2);
}
