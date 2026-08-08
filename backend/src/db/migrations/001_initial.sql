-- ============================================================
-- HumanAPI — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- Users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Preferences
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('USER_EXPLICIT', 'USER_CORRECTION', 'AI_INFERRED', 'IMPORTED')),
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  importance TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (importance IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PROPOSED', 'ACTIVE', 'ARCHIVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, key)
);

CREATE INDEX idx_preferences_user ON preferences(user_id);
CREATE INDEX idx_preferences_category ON preferences(user_id, category);
CREATE INDEX idx_preferences_status ON preferences(user_id, status);

-- -----------------------------------------------------------
-- Preference Versions (audit trail for preference changes)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS preference_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preference_id UUID NOT NULL REFERENCES preferences(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('USER_EXPLICIT', 'USER_CORRECTION', 'AI_INFERRED', 'IMPORTED')),
  changed_by TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pref_versions_pref ON preference_versions(preference_id);

-- -----------------------------------------------------------
-- Preference Suggestions (AI-proposed preference updates)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS preference_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  proposed_value JSONB NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  source TEXT NOT NULL CHECK (source IN ('USER_CORRECTION', 'AI_INFERRED')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'IGNORED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_pref_suggestions_user ON preference_suggestions(user_id, status);

-- -----------------------------------------------------------
-- Policies (hard rules for autonomous decisions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  action TEXT NOT NULL CHECK (action IN ('AUTO_APPROVE', 'ASK_USER', 'REJECT')),
  priority INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_user ON policies(user_id, category);

-- -----------------------------------------------------------
-- Agents (external AI agents)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  api_key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Agent Permissions
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, permission)
);

CREATE INDEX idx_agent_perms ON agent_permissions(agent_id);

-- -----------------------------------------------------------
-- Decision Requests
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  decision_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'AWAITING_USER', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_decision_req_user ON decision_requests(user_id);
CREATE INDEX idx_decision_req_status ON decision_requests(status);
CREATE INDEX idx_decision_req_request_id ON decision_requests(request_id);

-- -----------------------------------------------------------
-- Decisions (the actual outcomes)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL REFERENCES decision_requests(request_id),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE', 'REJECT', 'ASK_USER')),
  confidence REAL NOT NULL DEFAULT 0.0,
  reason TEXT NOT NULL,
  matched_policies JSONB NOT NULL DEFAULT '[]',
  matched_preferences JSONB NOT NULL DEFAULT '[]',
  requires_user_action BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisions_request ON decisions(request_id);

-- -----------------------------------------------------------
-- User Overrides (human corrections to AI decisions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  original_decision TEXT NOT NULL CHECK (original_decision IN ('APPROVE', 'REJECT', 'ASK_USER')),
  override_decision TEXT NOT NULL CHECK (override_decision IN ('APPROVE', 'REJECT')),
  reason TEXT,
  remember_preference BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_overrides_decision ON user_overrides(decision_id);
CREATE INDEX idx_overrides_user ON user_overrides(user_id);

-- -----------------------------------------------------------
-- Seed: Default demo user
-- -----------------------------------------------------------
INSERT INTO users (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Lokeshwaran', 'lokeshwaran@humanapi.dev')
ON CONFLICT (email) DO NOTHING;
