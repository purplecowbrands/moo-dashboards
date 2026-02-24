CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL,
  client_timestamp TEXT,
  requires_attention INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_attention
  ON events(requires_attention, acked_at, created_at);

CREATE INDEX IF NOT EXISTS idx_events_module_action
  ON events(module, action_type, created_at);

CREATE TABLE IF NOT EXISTS state_store (
  module TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (module, entity_type, entity_id)
);
