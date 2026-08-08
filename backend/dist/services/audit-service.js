"use strict";
// ============================================================
// Audit Service — Decision audit logging (PRD §38)
// Every decision must create an audit record
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDecision = logDecision;
exports.logOverride = logOverride;
exports.getDecisionByRequestId = getDecisionByRequestId;
exports.getUserDecisions = getUserDecisions;
const supabase_1 = require("../db/supabase");
const db = () => (0, supabase_1.getSupabase)();
// -----------------------------------------------------------
// Log a decision
// -----------------------------------------------------------
async function logDecision(decision) {
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
    if (error)
        throw error;
    return data;
}
// -----------------------------------------------------------
// Log a user override
// -----------------------------------------------------------
async function logOverride(override) {
    const { error } = await db().from('user_overrides').insert(override);
    if (error)
        throw error;
}
// -----------------------------------------------------------
// Get decision by request ID
// -----------------------------------------------------------
async function getDecisionByRequestId(requestId) {
    const { data, error } = await db()
        .from('decisions')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error)
        return null;
    return data;
}
// -----------------------------------------------------------
// Get all decisions for a user (via decision_requests)
// -----------------------------------------------------------
async function getUserDecisions(userId, limit = 50) {
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
    if (error)
        throw error;
    return data || [];
}
