// src/lib/supabase.js
// ─── CONFIGURE THESE TWO VALUES ───────────────────────
export const SUPABASE_URL  = 'https://skmjfozklzmerfpbgvvz.supabase.co'
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbWpmb3prbHptZXJmcGJndnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDUzODQsImV4cCI6MjA5MjcyMTM4NH0.UYRT5JbBVOIztuQQEKJ7nB3WBHARFf72qnvfLRnnRAc'
// ──────────────────────────────────────────────────────

export function isConfigured() {
  return !SUPABASE_URL.includes('YOUR_PROJECT_ID')
}

async function sbFetch(path, opts = {}) {
  const { method = 'GET', body, params = {} } = opts
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`)
  // Always apply params as query string — required for WHERE clauses on PATCH/DELETE
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : '',
  }
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  if (res.status === 204) return null
  return res.json()
}

export const sb = {
  select:      (table, params = {})      => sbFetch(table, { params }),
  insert:      (table, body)             => sbFetch(table, { method: 'POST', body }),
  update:      (table, id, body)         => sbFetch(table, { method: 'PATCH', body, params: { id: `eq.${id}` } }),
  delete:      (table, id)               => sbFetch(table, { method: 'DELETE', params: { id: `eq.${id}` } }),
  deleteWhere: (table, params)           => sbFetch(table, { method: 'DELETE', params }),
  rpc:         (fn, body)                => sbFetch(`rpc/${fn}`, { method: 'POST', body }),
}
