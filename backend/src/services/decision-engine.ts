// ============================================================
// Decision Engine — 5-stage pipeline (PRD §25-31, §50)
//
// 1. Request Validation
// 2. Permission Check
// 3. Policy Evaluation (deterministic, before Claude)
// 4. Preference Retrieval (only relevant preferences)
// 5. Claude Reasoning
// ============================================================

import { getSupabase } from '../db/supabase';
import {
  DecisionRequestBody,
  DecisionResult,
  DecisionOutcome,
  DecisionRequestStatus,
  PreferenceStatus,
} from '@humanapi/shared';
import { checkPermission } from './permission-service';
import { evaluatePolicies } from './policy-engine';
import { getUserPreferences } from './preference-service';
import { getUserPolicies } from './policy-engine';
import { makeDecision } from './claude-service';
import { logDecision } from './audit-service';

const db = () => getSupabase();

// Default user for MVP (single-user demo)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// -----------------------------------------------------------
// Process a decision request through the full pipeline
// -----------------------------------------------------------
export async function processDecisionRequest(
  request: DecisionRequestBody
): Promise<DecisionResult> {
  const startTime = Date.now();

  // ── Stage 1: Request Validation ──
  validateRequest(request);

  // ── Create decision request record ──
  const { data: reqRecord, error: reqError } = await db()
    .from('decision_requests')
    .insert({
      request_id: request.request_id,
      user_id: DEFAULT_USER_ID,
      agent_id: request.agent_id,
      decision_type: request.decision_type,
      payload: request.payload,
      status: DecisionRequestStatus.PENDING,
    })
    .select()
    .single();

  if (reqError) throw new Error(`Failed to create decision request: ${reqError.message}`);

  try {
    // ── Stage 2: Permission Check ──
    const hasPermission = await checkPermission(request.agent_id, request.decision_type);
    if (!hasPermission) {
      const result = await finalize(request.request_id, {
        request_id: request.request_id,
        decision: DecisionOutcome.REJECT,
        confidence: 1.0,
        reason: 'Requester does not have permission to request this decision type.',
        matched_policies: [],
        matched_preferences: [],
        requires_user_action: false,
      });
      return result;
    }

    // ── Stage 3: Policy Evaluation (deterministic, before Claude) ──
    const categoryMap: Record<string, string> = {
      flight_purchase: 'travel',
      hotel_booking: 'travel',
    };
    const category = categoryMap[request.decision_type] || request.decision_type;
    const payload = request.payload as Record<string, any>;

    const policyResult = await evaluatePolicies(DEFAULT_USER_ID, category, payload);

    if (policyResult.decision !== null) {
      const result = await finalize(request.request_id, {
        request_id: request.request_id,
        decision: policyResult.decision,
        confidence: 1.0,
        reason: policyResult.decision === DecisionOutcome.APPROVE
          ? `Automatically approved by policy: ${policyResult.matched_policies.join(', ')}`
          : policyResult.decision === DecisionOutcome.REJECT
            ? `Rejected by policy: ${policyResult.matched_policies.join(', ')}`
            : `Requires user approval per policy: ${policyResult.matched_policies.join(', ')}`,
        matched_policies: policyResult.matched_policies,
        matched_preferences: [],
        requires_user_action: policyResult.decision === DecisionOutcome.ASK_USER,
      });
      return result;
    }

    // ── Stage 4: Preference Retrieval (only relevant) ──
    const preferences = await getUserPreferences(DEFAULT_USER_ID, category, PreferenceStatus.ACTIVE);
    const policies = await getUserPolicies(DEFAULT_USER_ID, category);

    // ── Stage 5: Claude Reasoning ──
    const claudeResult = await makeDecision(request, preferences, policies);

    const result = await finalize(request.request_id, {
      request_id: request.request_id,
      decision: claudeResult.decision,
      confidence: claudeResult.confidence,
      reason: claudeResult.reason,
      matched_policies: claudeResult.matched_policies,
      matched_preferences: claudeResult.matched_preferences,
      requires_user_action: claudeResult.requires_user_action,
    });

    const duration = Date.now() - startTime;
    console.log(`Decision ${request.request_id} processed in ${duration}ms: ${result.decision}`);

    return result;
  } catch (error) {
    // On any error, default to ASK_USER for safety
    console.error('Decision engine error:', error);
    return await finalize(request.request_id, {
      request_id: request.request_id,
      decision: DecisionOutcome.ASK_USER,
      confidence: 0,
      reason: 'An error occurred during decision processing. Requesting human review.',
      matched_policies: [],
      matched_preferences: [],
      requires_user_action: true,
    });
  }
}

// -----------------------------------------------------------
// Validate request structure
// -----------------------------------------------------------
function validateRequest(request: DecisionRequestBody): void {
  if (!request.request_id) throw { statusCode: 400, message: 'request_id is required' };
  if (!request.agent_id) throw { statusCode: 400, message: 'agent_id is required' };
  if (!request.decision_type) throw { statusCode: 400, message: 'decision_type is required' };
  if (!request.payload) throw { statusCode: 400, message: 'payload is required' };

  // Type-specific validation
  if (request.decision_type === 'flight_purchase') {
    const p = request.payload as Record<string, any>;
    if (!p.airline) throw { statusCode: 400, message: 'payload.airline is required' };
    if (p.price === undefined) throw { statusCode: 400, message: 'payload.price is required' };
    if (!p.origin) throw { statusCode: 400, message: 'payload.origin is required' };
    if (!p.destination) throw { statusCode: 400, message: 'payload.destination is required' };
  }
}

// -----------------------------------------------------------
// Finalize: log decision + update request status
// -----------------------------------------------------------
async function finalize(
  requestId: string,
  result: Omit<DecisionResult, 'id' | 'created_at'>
): Promise<DecisionResult> {
  // Log decision to audit table
  const logged = await logDecision(result);

  // Update decision request status
  const status = result.requires_user_action
    ? DecisionRequestStatus.AWAITING_USER
    : DecisionRequestStatus.COMPLETED;

  await db()
    .from('decision_requests')
    .update({
      status,
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
    })
    .eq('request_id', requestId);

  return logged;
}
