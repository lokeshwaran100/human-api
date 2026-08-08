// ============================================================
// Agent Routes — PRD §35-36
// ============================================================

import { FastifyInstance } from 'fastify';
import { getSupabase } from '../db/supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AgentRegistrationBody, AgentRegistrationResponse } from '@humanapi/shared';

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function agentRoutes(fastify: FastifyInstance) {
  // POST /api/v1/agents — Register a new agent (PRD §35)
  fastify.post<{ Body: AgentRegistrationBody }>('/api/v1/agents', async (request, reply) => {
    const { name, description, capabilities } = request.body;

    // Generate API key
    const apiKey = `hapi_${uuidv4().replace(/-/g, '')}`;
    const apiKeyHash = hashApiKey(apiKey);

    const { data: agent, error } = await getSupabase()
      .from('agents')
      .insert({
        name,
        description,
        api_key_hash: apiKeyHash,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    // Create permissions from capabilities
    const permissions = capabilities.map(cap => ({
      agent_id: agent.id,
      permission: `decision:${cap}`,
    }));

    if (permissions.length > 0) {
      await getSupabase().from('agent_permissions').insert(permissions);
    }

    const response: AgentRegistrationResponse = {
      agent_id: agent.id,
      api_key: apiKey, // Only time the raw key is returned
      name: agent.name,
    };

    return reply.code(201).send(response);
  });

  // GET /api/v1/agents — List all agents
  fastify.get('/api/v1/agents', async (request, reply) => {
    const { data: agents, error } = await getSupabase()
      .from('agents')
      .select(`
        id, name, description, status, created_at, updated_at,
        agent_permissions (id, permission, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    return reply.send(agents || []);
  });

  // GET /api/v1/agents/:id — Get a single agent
  fastify.get<{ Params: { id: string } }>('/api/v1/agents/:id', async (request, reply) => {
    const { data: agent, error } = await getSupabase()
      .from('agents')
      .select(`
        id, name, description, status, created_at, updated_at,
        agent_permissions (id, permission, created_at)
      `)
      .eq('id', request.params.id)
      .single();

    if (error || !agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return reply.send(agent);
  });

  // PUT /api/v1/agents/:id/permissions — Update agent permissions
  fastify.put<{ Params: { id: string }; Body: { permissions: string[] } }>(
    '/api/v1/agents/:id/permissions',
    async (request, reply) => {
      const { id } = request.params;
      const { permissions } = request.body;

      // Remove old permissions
      await getSupabase().from('agent_permissions').delete().eq('agent_id', id);

      // Insert new
      if (permissions.length > 0) {
        const rows = permissions.map(p => ({ agent_id: id, permission: p }));
        await getSupabase().from('agent_permissions').insert(rows);
      }

      return reply.send({ agent_id: id, permissions });
    }
  );

  // DELETE /api/v1/agents/:id — Revoke an agent
  fastify.delete<{ Params: { id: string } }>('/api/v1/agents/:id', async (request, reply) => {
    await getSupabase()
      .from('agents')
      .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
      .eq('id', request.params.id);

    return reply.code(204).send();
  });
}
