"use strict";
// ============================================================
// Policy Engine — Deterministic policy evaluation (PRD §28)
// Policies are evaluated BEFORE Claude for safety/predictability
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePolicies = evaluatePolicies;
exports.getUserPolicies = getUserPolicies;
exports.createPolicy = createPolicy;
exports.updatePolicy = updatePolicy;
exports.deletePolicy = deletePolicy;
const supabase_1 = require("../db/supabase");
const shared_1 = require("@humanapi/shared");
const db = () => (0, supabase_1.getSupabase)();
// -----------------------------------------------------------
// Evaluate all policies for a request
// Priority: REJECT > AUTO_APPROVE > ASK_USER (PRD §24)
// -----------------------------------------------------------
async function evaluatePolicies(userId, category, payload) {
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
    const matched = [];
    for (const policy of policies) {
        const conditions = policy.conditions || [];
        const allMatch = conditions.every(cond => evaluateCondition(cond, payload));
        if (allMatch && conditions.length > 0) {
            matched.push({ policy, action: policy.action });
        }
    }
    if (matched.length === 0) {
        return { decision: null, matched_policies: [] };
    }
    // Priority order: REJECT > AUTO_APPROVE > ASK_USER
    const rejectMatch = matched.find(m => m.action === shared_1.PolicyAction.REJECT);
    if (rejectMatch) {
        return {
            decision: shared_1.DecisionOutcome.REJECT,
            matched_policies: [rejectMatch.policy.name],
        };
    }
    const approveMatch = matched.find(m => m.action === shared_1.PolicyAction.AUTO_APPROVE);
    if (approveMatch) {
        return {
            decision: shared_1.DecisionOutcome.APPROVE,
            matched_policies: [approveMatch.policy.name],
        };
    }
    const askMatch = matched.find(m => m.action === shared_1.PolicyAction.ASK_USER);
    if (askMatch) {
        return {
            decision: shared_1.DecisionOutcome.ASK_USER,
            matched_policies: [askMatch.policy.name],
        };
    }
    return { decision: null, matched_policies: [] };
}
// -----------------------------------------------------------
// Evaluate a single condition against payload
// -----------------------------------------------------------
function evaluateCondition(condition, payload) {
    const fieldValue = payload[condition.field];
    if (fieldValue === undefined)
        return false;
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
async function getUserPolicies(userId, category) {
    let query = db().from('policies').select('*').eq('user_id', userId);
    if (category)
        query = query.eq('category', category);
    const { data, error } = await query.order('priority', { ascending: true });
    if (error)
        throw error;
    return data || [];
}
async function createPolicy(policy) {
    const { data, error } = await db()
        .from('policies')
        .insert(policy)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function updatePolicy(id, updates) {
    const { data, error } = await db()
        .from('policies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function deletePolicy(id) {
    await db().from('policies').delete().eq('id', id);
}
