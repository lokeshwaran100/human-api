"use strict";
// ============================================================
// User Routes — Profile and dashboard stats
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const supabase_1 = require("../db/supabase");
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
async function userRoutes(fastify) {
    // GET /api/v1/user — Get current user profile
    fastify.get('/api/v1/user', async (request, reply) => {
        const { data: user, error } = await (0, supabase_1.getSupabase)()
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
        const db = (0, supabase_1.getSupabase)();
        // Get today's decisions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: requests } = await db
            .from('decision_requests')
            .select('status')
            .eq('user_id', DEFAULT_USER_ID)
            .gte('created_at', today.toISOString());
        const total = requests?.length || 0;
        const approved = requests?.filter((r) => r.status === 'COMPLETED').length || 0;
        const awaiting = requests?.filter((r) => r.status === 'AWAITING_USER').length || 0;
        // Get decisions for today to count actual approve/reject
        const { data: decisions } = await db
            .from('decisions')
            .select('decision')
            .gte('created_at', today.toISOString());
        const approvedCount = decisions?.filter((d) => d.decision === 'APPROVE').length || 0;
        const rejectedCount = decisions?.filter((d) => d.decision === 'REJECT').length || 0;
        // Get pending suggestions
        const { data: suggestions } = await db
            .from('preference_suggestions')
            .select('id')
            .eq('user_id', DEFAULT_USER_ID)
            .eq('status', 'PENDING');
        const stats = {
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
    fastify.put('/api/v1/user', async (request, reply) => {
        const updates = { updated_at: new Date().toISOString() };
        if (request.body.name)
            updates.name = request.body.name;
        if (request.body.email)
            updates.email = request.body.email;
        if (request.body.avatar_url)
            updates.avatar_url = request.body.avatar_url;
        const { data, error } = await (0, supabase_1.getSupabase)()
            .from('users')
            .update(updates)
            .eq('id', DEFAULT_USER_ID)
            .select()
            .single();
        if (error)
            return reply.code(500).send({ error: error.message });
        return reply.send(data);
    });
}
