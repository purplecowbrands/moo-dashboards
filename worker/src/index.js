export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env, request) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'moo-feedback-platform' }, 200, env, request);
    }

    if (request.method === 'POST' && url.pathname === '/api/events') {
      return handlePostEvent(request, env);
    }

    if (request.method === 'GET' && url.pathname.match(/^\/api\/state\/[A-Za-z0-9_-]+$/)) {
      const moduleName = url.pathname.split('/').pop();
      return handleGetState(moduleName, request, env);
    }

    if (request.method === 'GET' && url.pathname === '/api/feedback/queue') {
      if (!isAuthorized(request, env)) {
        return json({ error: 'Unauthorized' }, 401, env, request);
      }
      return handleGetQueue(request, env);
    }

    if (request.method === 'POST' && url.pathname.match(/^\/api\/feedback\/ack\/[A-Za-z0-9_-]+$/)) {
      if (!isAuthorized(request, env)) {
        return json({ error: 'Unauthorized' }, 401, env, request);
      }
      const id = url.pathname.split('/').pop();
      return handleAck(id, request, env);
    }

    return json({ error: 'Not found' }, 404, env, request);
  }
};

function isAuthorized(request, env) {
  if (!env.CRON_API_TOKEN) return true;
  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${env.CRON_API_TOKEN}`;
}

async function handlePostEvent(request, env) {
  const body = await request.json();

  const moduleName = body?.module;
  const actionType = body?.actionType;
  const entityType = body?.entityType || 'item';
  const entityId = body?.entityId;
  const payload = body?.payload || {};
  const source = body?.source || 'dashboard-ui';
  const clientTimestamp = body?.clientTimestamp || new Date().toISOString();
  const requiresAttention = Number(body?.requiresAttention || 0);

  if (!moduleName || !actionType || !entityId) {
    return json({ error: 'module, actionType, and entityId are required' }, 400, env, request);
  }

  await env.FEEDBACK_DB.prepare(
    `INSERT INTO events (id, module, action_type, entity_type, entity_id, payload_json, source, client_timestamp, requires_attention)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), moduleName, actionType, entityType, entityId, JSON.stringify(payload), source, clientTimestamp, requiresAttention)
    .run();

  await env.FEEDBACK_DB.prepare(
    `INSERT INTO state_store (module, entity_type, entity_id, state_json, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(module, entity_type, entity_id)
     DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP`
  )
    .bind(moduleName, entityType, entityId, JSON.stringify(payload))
    .run();

  return json({ ok: true }, 200, env, request);
}

async function handleGetState(moduleName, request, env) {
  const rows = await env.FEEDBACK_DB.prepare(
    `SELECT module, entity_type, entity_id, state_json, updated_at
     FROM state_store
     WHERE module = ?
     ORDER BY updated_at DESC`
  ).bind(moduleName).all();

  const items = (rows.results || []).map(row => ({
    module: row.module,
    entityType: row.entity_type,
    entityId: row.entity_id,
    state: JSON.parse(row.state_json || '{}'),
    updatedAt: row.updated_at
  }));

  return json({ module: moduleName, items, count: items.length }, 200, env, request);
}

async function handleGetQueue(request, env) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || 50);
  const moduleFilter = url.searchParams.get('module');
  const actionFilter = url.searchParams.get('actionType');

  let query = `SELECT id, module, action_type, entity_type, entity_id, payload_json, source, client_timestamp, created_at
               FROM events
               WHERE requires_attention = 1 AND acked_at IS NULL`;
  const binds = [];

  if (moduleFilter) {
    query += ' AND module = ?';
    binds.push(moduleFilter);
  }

  if (actionFilter) {
    query += ' AND action_type = ?';
    binds.push(actionFilter);
  }

  query += ' ORDER BY created_at ASC LIMIT ?';
  binds.push(limit);

  const rows = await env.FEEDBACK_DB.prepare(query).bind(...binds).all();

  const items = (rows.results || []).map(row => ({
    id: row.id,
    module: row.module,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: JSON.parse(row.payload_json || '{}'),
    source: row.source,
    clientTimestamp: row.client_timestamp,
    createdAt: row.created_at
  }));

  return json({ items, count: items.length }, 200, env, request);
}

async function handleAck(id, request, env) {
  await env.FEEDBACK_DB.prepare('UPDATE events SET acked_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
  return json({ ok: true, ackedId: id }, 200, env, request);
}

function json(data, status, env, request) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(env, request)
    }
  });
}

function corsHeaders(env, request) {
  const origin = request.headers.get('origin');
  const allowed = env.ALLOWED_ORIGIN || '*';
  const acao = allowed === '*' ? '*' : origin === allowed ? allowed : 'null';

  return {
    'access-control-allow-origin': acao,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization'
  };
}
