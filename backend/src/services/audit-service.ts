// ============================================================
// Audit Service — Decision audit logging (PRD §38)
// Every decision must create an audit record
// ============================================================

import { getSupabase } from '../db/supabase';
import { DecisionResult, DecisionOutcome } from '@humanapi/shared';

const db = () => getSupabase();

// -----------------------------------------------------------
// Log a decision
// -----------------------------------------------------------
export async function logDecision(decision: {
  request_id: string;
  decision: DecisionOutcome;
  confidence: number;
  reason: string;
  matched_policies: string[];
  matched_preferences: string[];
  requires_user_action: boolean;
}): Promise<DecisionResult> {
  const { data, error } = await db()
    .from('decisions')
    .insert({
      request_id: decision.request_id,
      decision: decision.decision,
      confidence: decision.confidence,
      reason: decision.reason,
      matched_policies: decision.matched_policies,
      matched_preferences: decision.matched_preferences,
      requires_user_action: decision.requires_user_action,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// -----------------------------------------------------------
// Log a user override
// -----------------------------------------------------------
export async function logOverride(override: {
  decision_id: string;
  user_id: string;
  original_decision: DecisionOutcome;
  override_decision: DecisionOutcome;
  reason?: string;
  remember_preference: boolean;
}): Promise<void> {
  const { error } = await db().from('user_overrides').insert(override);
  if (error) throw error;
}

// -----------------------------------------------------------
// Get decision by request ID
// -----------------------------------------------------------
export async function getDecisionByRequestId(requestId: string): Promise<DecisionResult | null> {
  const { data, error } = await db()
    .from('decisions')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

// -----------------------------------------------------------
// Get all decisions for a user (via decision_requests)
// -----------------------------------------------------------
export async function getUserDecisions(userId: string, limit: number = 50) {
  const { data, error } = await db()
    .from('decision_requests')
    .select(`
      *,
      decisions (*),
      agents (id, name, description),
      user_overrides:decisions(user_overrides(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
