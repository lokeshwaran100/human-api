"use strict";
// ============================================================
// Policy Routes — CRUD for decision policies
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRoutes = policyRoutes;
const policy_engine_1 = require("../services/policy-engine");
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
async function policyRoutes(fastify) {
    // GET /api/v1/policies — List all policies
    fastify.get('/api/v1/policies', async (request, reply) => {
        const policies = await (0, policy_engine_1.getUserPolicies)(DEFAULT_USER_ID, request.query.category);
        return reply.send(policies);
    });
    // POST /api/v1/policies — Create a policy
    fastify.post('/api/v1/policies', async (request, reply) => {
        const { name, category, conditions, action, priority, enabled } = request.body;
        const policy = await (0, policy_engine_1.createPolicy)({
            user_id: DEFAULT_USER_ID,
            name,
            category,
            conditions,
            action: action,
            priority: priority ?? 0,
            enabled: enabled ?? true,
        });
        return reply.code(201).send(policy);
    });
    // PUT /api/v1/policies/:id — Update a policy
    fastify.put('/api/v1/policies/:id', async (request, reply) => {
        const updates = {};
        if (request.body.name)
            updates.name = request.body.name;
        if (request.body.conditions)
            updates.conditions = request.body.conditions;
        if (request.body.action)
            updates.action = request.body.action;
        if (request.body.priority !== undefined)
            updates.priority = request.body.priority;
        if (request.body.enabled !== undefined)
            updates.enabled = request.body.enabled;
        const policy = await (0, policy_engine_1.updatePolicy)(request.params.id, updates);
        return reply.send(policy);
    });
    // DELETE /api/v1/policies/:id — Delete a policy
    fastify.delete('/api/v1/policies/:id', async (request, reply) => {
        await (0, policy_engine_1.deletePolicy)(request.params.id);
        return reply.code(204).send();
    });
}
