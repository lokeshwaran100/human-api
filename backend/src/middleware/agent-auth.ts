// ============================================================
// Agent Auth Middleware — API key validation (PRD §49)
// ============================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabase } from '../db/supabase';
import crypto from 'crypto';

export async function agentAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer hapi_')) {
    reply.code(401).send({ error: 'Missing or invalid API key' });
    return;
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const { data: agent } = await getSupabase()
    .from('agents')
    .select('id, status')
    .eq('api_key_hash', apiKeyHash)
    .single();

  if (!agent || agent.status !== 'ACTIVE') {
    reply.code(401).send({ error: 'Invalid or revoked API key' });
    return;
  }

  // Attach agent info to request
  (request as any).agentId = agent.id;
}
