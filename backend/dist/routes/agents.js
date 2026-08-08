"use strict";
// ============================================================
// Agent Routes — PRD §35-36
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = agentRoutes;
const supabase_1 = require("../db/supabase");
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
function hashApiKey(key) {
    return crypto_1.default.createHash('sha256').update(key).digest('hex');
}
async function agentRoutes(fastify) {
    // POST /api/v1/agents — Register a new agent (PRD §35)
    fastify.post('/api/v1/agents', async (request, reply) => {
        const { name, description, capabilities } = request.body;
        // Generate API key
        const apiKey = `hapi_${(0, uuid_1.v4)().replace(/-/g, '')}`;
        const apiKeyHash = hashApiKey(apiKey);
        const { data: agent, error } = await (0, supabase_1.getSupabase)()
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
            await (0, supabase_1.getSupabase)().from('agent_permissions').insert(permissions);
        }
        const response = {
            agent_id: agent.id,
            api_key: apiKey, // Only time the raw key is returned
            name: agent.name,
        };
        return reply.code(201).send(response);
    });
    // GET /api/v1/agents — List all agents
    fastify.get('/api/v1/agents', async (request, reply) => {
        const { data: agents, error } = await (0, supabase_1.getSupabase)()
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
    fastify.get('/api/v1/agents/:id', async (request, reply) => {
        const { data: agent, error } = await (0, supabase_1.getSupabase)()
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
    fastify.put('/api/v1/agents/:id/permissions', async (request, reply) => {
        const { id } = request.params;
        const { permissions } = request.body;
        // Remove old permissions
        await (0, supabase_1.getSupabase)().from('agent_permissions').delete().eq('agent_id', id);
        // Insert new
        if (permissions.length > 0) {
            const rows = permissions.map(p => ({ agent_id: id, permission: p }));
            await (0, supabase_1.getSupabase)().from('agent_permissions').insert(rows);
        }
        return reply.send({ agent_id: id, permissions });
    });
    // DELETE /api/v1/agents/:id — Revoke an agent
    fastify.delete('/api/v1/agents/:id', async (request, reply) => {
        await (0, supabase_1.getSupabase)()
            .from('agents')
            .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
            .eq('id', request.params.id);
        return reply.code(204).send();
    });
}
