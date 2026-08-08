// ============================================================
// Policy Engine — Deterministic policy evaluation (PRD §28)
// Policies are evaluated BEFORE Claude for safety/predictability
// ============================================================

import { getSupabase } from '../db/supabase';
import { Policy, PolicyAction, PolicyCondition, DecisionOutcome } from '@humanapi/shared';

const db = () => getSupabase();

export interface PolicyEvalResult {
  decision: DecisionOutcome | null;
  matched_policies: string[];
}

// -----------------------------------------------------------
// Evaluate all policies for a request
// Priority: REJECT > AUTO_APPROVE > ASK_USER (PRD §24)
// -----------------------------------------------------------
export async function evaluatePolicies(
  userId: string,
  category: string,
  payload: Record<string, any>
): Promise<PolicyEvalResult> {
  const { data: policies, error } = await db()
    .from('policies')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (error || !policies || policies.length === 0) {
    return { decision: null, matched_policies: [] };
  }

  const matched: { policy: Policy; action: PolicyAction }[] = [];

  for (const policy of policies) {
    const conditions: PolicyCondition[] = policy.conditions || [];
    const allMatch = conditions.every(cond => evaluateCondition(cond, payload));

    if (allMatch && conditions.length > 0) {
      matched.push({ policy, action: policy.action as PolicyAction });
    }
  }

  if (matched.length === 0) {
    return { decision: null, matched_policies: [] };
  }

  // Priority order: REJECT > AUTO_APPROVE > ASK_USER
  const rejectMatch = matched.find(m => m.action === PolicyAction.REJECT);
  if (rejectMatch) {
    return {
      decision: DecisionOutcome.REJECT,
      matched_policies: [rejectMatch.policy.name],
    };
  }

  const approveMatch = matched.find(m => m.action === PolicyAction.AUTO_APPROVE);
  if (approveMatch) {
    return {
      decision: DecisionOutcome.APPROVE,
      matched_policies: [approveMatch.policy.name],
    };
  }

  const askMatch = matched.find(m => m.action === PolicyAction.ASK_USER);
  if (askMatch) {
    return {
      decision: DecisionOutcome.ASK_USER,
      matched_policies: [askMatch.policy.name],
    };
  }

  return { decision: null, matched_policies: [] };
}

// -----------------------------------------------------------
// Evaluate a single condition against payload
// -----------------------------------------------------------
function evaluateCondition(condition: PolicyCondition, payload: Record<string, any>): boolean {
  const fieldValue = payload[condition.field];
  if (fieldValue === undefined) return false;

  switch (condition.operator) {
    case 'lt':
      return Number(fieldValue) < Number(condition.value);
    case 'lte':
      return Number(fieldValue) <= Number(condition.value);
    case 'gt':
      return Number(fieldValue) > Number(condition.value);
    case 'gte':
      return Number(fieldValue) >= Number(condition.value);
    case 'eq':
      return fieldValue === condition.value;
    case 'neq':
      return fieldValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

// -----------------------------------------------------------
// Policy CRUD
// -----------------------------------------------------------
export async function getUserPolicies(userId: string, category?: string): Promise<Policy[]> {
  let query = db().from('policies').select('*').eq('user_id', userId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('priority', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPolicy(policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>): Promise<Policy> {
  const { data, error } = await db()
    .from('policies')
    .insert(policy)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePolicy(
  id: string,
  updates: Partial<Pick<Policy, 'name' | 'conditions' | 'action' | 'priority' | 'enabled'>>
): Promise<Policy> {
  const { data, error } = await db()
    .from('policies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePolicy(id: string): Promise<void> {
  await db().from('policies').delete().eq('id', id);
}
