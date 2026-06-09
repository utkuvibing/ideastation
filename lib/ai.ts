export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ModelOption = { id: string; label: string };

function getBaseUrl() {
  // 127.0.0.1 matches opencode serve default hostname (avoids some Windows localhost/IPv6 issues).
  return (process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:4096').replace(/\/$/, '');
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const user = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
  const pass = process.env.OPENCODE_SERVER_PASSWORD ?? '';
  if (pass) headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  return headers;
}

function connectionHelp(baseUrl: string, path: string) {
  return [
    `${baseUrl}${path} erişilemiyor.`,
    'OpenCode sunucusu çalışmıyor veya yanlış portta olabilir. Ayrı bir terminalde:',
    '  npm run opencode:serve',
    'veya: opencode serve --port 4096',
    'Not: `opencode serve` (portsuz) rastgele port kullanır; bu uygulama 4096 bekler.',
  ].join(' ');
}

async function fetchJson(path: string, init?: RequestInit) {
  const baseUrl = getBaseUrl();
  let res: Response | undefined;
  const attempts = Number(process.env.AI_RETRY_COUNT || 2) + 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { ...authHeaders(), ...(init?.headers || {}) },
        cache: 'no-store',
        signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS || 90000)),
      });
      if (res.ok || res.status < 500 || attempt === attempts) break;
    } catch {
      if (attempt === attempts) throw new Error(connectionHelp(baseUrl, path));
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }
  if (!res) throw new Error(connectionHelp(baseUrl, path));
  if (res.status === 401) {
    throw new Error(
      `${path}: 401 yetkisiz. .env içindeki OPENCODE_SERVER_PASSWORD, sunucuyu başlattığın şifreyle aynı olmalı. (OPENCODE_API_KEY yerel sunucu auth için kullanılmaz.)`,
    );
  }
  if (!res.ok) throw new Error(`${path} başarısız: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export async function checkOpenCodeHealth(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const json = await fetchJson('/global/health');
    return { ok: Boolean(json?.healthy), version: json?.version };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Bağlantı hatası' };
  }
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
  const startedAt = Date.now();
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
  const response = text || JSON.stringify(result, null, 2);
  return {
    text: response,
    durationMs: Date.now() - startedAt,
    inputChars: content.length,
    outputChars: response.length,
    estimatedCostUsd: Number(((content.length + response.length) / 4 / 1_000_000 * Number(process.env.AI_ESTIMATED_USD_PER_MILLION_TOKENS || 5)).toFixed(6)),
  };
}
