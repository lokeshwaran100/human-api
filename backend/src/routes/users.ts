// ============================================================
// User Routes — Profile and dashboard stats
// ============================================================

import { FastifyInstance } from 'fastify';
import { getSupabase } from '../db/supabase';
import { DashboardStats, DecisionRequestStatus } from '@humanapi/shared';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/v1/user — Get current user profile
  fastify.get('/api/v1/user', async (request, reply) => {
    const { data: user, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', DEFAULT_USER_ID)
      .single();

    if (error || !user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send(user);
  });

  // GET /api/v1/dashboard — Dashboard stats
  fastify.get('/api/v1/dashboard', async (request, reply) => {
    const db = getSupabase();

    // Get today's decisions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: requests } = await db
      .from('decision_requests')
      .select('status')
      .eq('user_id', DEFAULT_USER_ID)
      .gte('created_at', today.toISOString());

    const total = requests?.length || 0;
    const approved = requests?.filter((r: any) => r.status === 'COMPLETED').length || 0;
    const awaiting = requests?.filter((r: any) => r.status === 'AWAITING_USER').length || 0;

    // Get decisions for today to count actual approve/reject
    const { data: decisions } = await db
      .from('decisions')
      .select('decision')
      .gte('created_at', today.toISOString());

    const approvedCount = decisions?.filter((d: any) => d.decision === 'APPROVE').length || 0;
    const rejectedCount = decisions?.filter((d: any) => d.decision === 'REJECT').length || 0;

    // Get pending suggestions
    const { data: suggestions } = await db
      .from('preference_suggestions')
      .select('id')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('status', 'PENDING');

    const stats: DashboardStats = {
      total_decisions: total,
      approved: approvedCount,
      rejected: rejectedCount,
      awaiting_user: awaiting,
      pending_suggestions: suggestions?.length || 0,
      agent_status: 'online',
    };

    return reply.send(stats);
  });

  // PUT /api/v1/user — Update user profile
  fastify.put<{ Body: { name?: string; email?: string; avatar_url?: string } }>(
    '/api/v1/user',
    async (request, reply) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (request.body.name) updates.name = request.body.name;
      if (request.body.email) updates.email = request.body.email;
      if (request.body.avatar_url) updates.avatar_url = request.body.avatar_url;

      const { data, error } = await getSupabase()
        .from('users')
        .update(updates)
        .eq('id', DEFAULT_USER_ID)
        .select()
        .single();

      if (error) return reply.code(500).send({ error: error.message });
      return reply.send(data);
    }
  );
}
