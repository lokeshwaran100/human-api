"use strict";
// ============================================================
// Permission Service — Agent permission verification (PRD §27)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = checkPermission;
exports.getAgentPermissions = getAgentPermissions;
exports.grantPermission = grantPermission;
exports.revokePermission = revokePermission;
const supabase_1 = require("../db/supabase");
const db = () => (0, supabase_1.getSupabase)();
// -----------------------------------------------------------
// Check if an agent has permission for a decision type
// -----------------------------------------------------------
async function checkPermission(agentId, decisionType) {
    const permission = `decision:${decisionType}`;
    const { data, error } = await db()
        .from('agent_permissions')
        .select('id')
        .eq('agent_id', agentId)
        .eq('permission', permission)
        .single();
    if (error || !data)
        return false;
    return true;
}
// -----------------------------------------------------------
// Get all permissions for an agent
// -----------------------------------------------------------
async function getAgentPermissions(agentId) {
    const { data, error } = await db()
        .from('agent_permissions')
        .select('*')
        .eq('agent_id', agentId);
    if (error)
        throw error;
    return data || [];
}
// -----------------------------------------------------------
// Grant a permission to an agent
// -----------------------------------------------------------
async function grantPermission(agentId, permission) {
    const { data, error } = await db()
        .from('agent_permissions')
        .upsert({ agent_id: agentId, permission }, { onConflict: 'agent_id,permission' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// -----------------------------------------------------------
// Revoke a permission from an agent
// -----------------------------------------------------------
async function revokePermission(agentId, permission) {
    await db()
        .from('agent_permissions')
        .delete()
        .eq('agent_id', agentId)
        .eq('permission', permission);
}
