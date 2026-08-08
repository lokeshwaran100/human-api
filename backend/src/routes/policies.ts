// ============================================================
// Policy Routes — CRUD for decision policies
// ============================================================

import { FastifyInstance } from 'fastify';
import { getUserPolicies, createPolicy, updatePolicy, deletePolicy } from '../services/policy-engine';
import { PolicyAction } from '@humanapi/shared';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function policyRoutes(fastify: FastifyInstance) {
  // GET /api/v1/policies — List all policies
  fastify.get<{ Querystring: { category?: string } }>('/api/v1/policies', async (request, reply) => {
    const policies = await getUserPolicies(DEFAULT_USER_ID, request.query.category);
    return reply.send(policies);
  });

  // POST /api/v1/policies — Create a policy
  fastify.post<{
    Body: {
      name: string;
      category: string;
      conditions: any[];
      action: string;
      priority?: number;
      enabled?: boolean;
    };
  }>('/api/v1/policies', async (request, reply) => {
    const { name, category, conditions, action, priority, enabled } = request.body;
    const policy = await createPolicy({
      user_id: DEFAULT_USER_ID,
      name,
      category,
      conditions,
      action: action as PolicyAction,
      priority: priority ?? 0,
      enabled: enabled ?? true,
    });
    return reply.code(201).send(policy);
  });

  // PUT /api/v1/policies/:id — Update a policy
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      conditions?: any[];
      action?: string;
      priority?: number;
      enabled?: boolean;
    };
  }>('/api/v1/policies/:id', async (request, reply) => {
    const updates: any = {};
    if (request.body.name) updates.name = request.body.name;
    if (request.body.conditions) updates.conditions = request.body.conditions;
    if (request.body.action) updates.action = request.body.action;
    if (request.body.priority !== undefined) updates.priority = request.body.priority;
    if (request.body.enabled !== undefined) updates.enabled = request.body.enabled;

    const policy = await updatePolicy(request.params.id, updates);
    return reply.send(policy);
  });

  // DELETE /api/v1/policies/:id — Delete a policy
  fastify.delete<{ Params: { id: string } }>('/api/v1/policies/:id', async (request, reply) => {
    await deletePolicy(request.params.id);
    return reply.code(204).send();
  });
}
