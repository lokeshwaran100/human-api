// ============================================================
// Permission Service — Agent permission verification (PRD §27)
// ============================================================

import { getSupabase } from '../db/supabase';
import { AgentPermission } from '@humanapi/shared';

const db = () => getSupabase();

// -----------------------------------------------------------
// Check if an agent has permission for a decision type
// -----------------------------------------------------------
export async function checkPermission(
  agentId: string,
  decisionType: string
): Promise<boolean> {
  const permission = `decision:${decisionType}`;

  const { data, error } = await db()
    .from('agent_permissions')
    .select('id')
    .eq('agent_id', agentId)
    .eq('permission', permission)
    .single();

  if (error || !data) return false;
  return true;
}

// -----------------------------------------------------------
// Get all permissions for an agent
// -----------------------------------------------------------
export async function getAgentPermissions(agentId: string): Promise<AgentPermission[]> {
  const { data, error } = await db()
    .from('agent_permissions')
    .select('*')
    .eq('agent_id', agentId);

  if (error) throw error;
  return data || [];
}

// -----------------------------------------------------------
// Grant a permission to an agent
// -----------------------------------------------------------
export async function grantPermission(
  agentId: string,
  permission: string
): Promise<AgentPermission> {
  const { data, error } = await db()
    .from('agent_permissions')
    .upsert({ agent_id: agentId, permission }, { onConflict: 'agent_id,permission' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// -----------------------------------------------------------
// Revoke a permission from an agent
// -----------------------------------------------------------
export async function revokePermission(
  agentId: string,
  permission: string
): Promise<void> {
  await db()
    .from('agent_permissions')
    .delete()
    .eq('agent_id', agentId)
    .eq('permission', permission);
}
