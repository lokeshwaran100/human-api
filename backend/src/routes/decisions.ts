// ============================================================
// Decision Routes — PRD §32-34
// ============================================================

import { FastifyInstance } from 'fastify';
import { processDecisionRequest } from '../services/decision-engine';
import { getDecisionByRequestId, logOverride } from '../services/audit-service';
import { processOverride } from '../services/preference-learning';
import {
  DecisionRequestBody,
  DecisionResponseBody,
  DecisionOutcome,
  DecisionRequestStatus,
  OverrideRequestBody,
} from '@humanapi/shared';
import { getSupabase } from '../db/supabase';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function decisionRoutes(fastify: FastifyInstance) {
  // POST /api/v1/decisions — Submit a decision request (PRD §32)
  fastify.post<{ Body: DecisionRequestBody }>('/api/v1/decisions', async (request, reply) => {
    try {
      const result = await processDecisionRequest(request.body);

      // Return only decision information, not private data (PRD §37)
      const response: DecisionResponseBody = {
        request_id: result.request_id,
        decision: result.decision,
        confidence: result.confidence,
        reason: result.reason,
        requires_user_action: result.requires_user_action,
      };

      return reply.code(200).send(response);
    } catch (error: any) {
      if (error.statusCode === 400) {
        return reply.code(400).send({ error: error.message });
      }
      console.error('Decision error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/decisions/:request_id — Get decision status (PRD §33)
  fastify.get<{ Params: { request_id: string } }>('/api/v1/decisions/:request_id', async (request, reply) => {
    const { request_id } = request.params;

    const { data: req } = await getSupabase()
      .from('decision_requests')
      .select('*')
      .eq('request_id', request_id)
      .single();

    if (!req) {
      return reply.code(404).send({ error: 'Decision request not found' });
    }

    const decision = await getDecisionByRequestId(request_id);

    return reply.send({
      request_id: req.request_id,
      status: req.status,
      decision: decision?.decision || null,
      confidence: decision?.confidence || null,
      reason: decision?.reason || null,
      created_at: req.created_at,
      completed_at: req.completed_at,
    });
  });

  // POST /api/v1/decisions/:request_id/approve — User approval (PRD §34)
  fastify.post<{ Params: { request_id: string }; Body: { decision: 'APPROVE' | 'REJECT' } }>(
    '/api/v1/decisions/:request_id/approve',
    async (request, reply) => {
      const { request_id } = request.params;
      const { decision: userDecision } = request.body;

      // Get the original decision
      const originalDecision = await getDecisionByRequestId(request_id);
      if (!originalDecision) {
        return reply.code(404).send({ error: 'Decision not found' });
      }

      // Update the decision request status
      await getSupabase()
        .from('decision_requests')
        .update({
          status: DecisionRequestStatus.COMPLETED,
          completed_at: new Date().toISOString(),
        })
        .eq('request_id', request_id);

      // Log the override
      if (originalDecision.id) {
        await logOverride({
          decision_id: originalDecision.id,
          user_id: DEFAULT_USER_ID,
          original_decision: originalDecision.decision,
          override_decision: userDecision as DecisionOutcome,
          remember_preference: false,
        });
      }

      return reply.send({
        request_id,
        decision: userDecision,
        status: 'completed',
      });
    }
  );

  // POST /api/v1/decisions/:request_id/override — User override with learning (PRD §39-40)
  fastify.post<{ Params: { request_id: string }; Body: OverrideRequestBody }>(
    '/api/v1/decisions/:request_id/override',
    async (request, reply) => {
      const { request_id } = request.params;
      const { override_decision, reason, remember_preference } = request.body;

      const originalDecision = await getDecisionByRequestId(request_id);
      if (!originalDecision) {
        return reply.code(404).send({ error: 'Decision not found' });
      }

      // Update decision request status
      await getSupabase()
        .from('decision_requests')
        .update({
          status: DecisionRequestStatus.COMPLETED,
          completed_at: new Date().toISOString(),
        })
        .eq('request_id', request_id);

      // Log override
      if (originalDecision.id) {
        await logOverride({
          decision_id: originalDecision.id,
          user_id: DEFAULT_USER_ID,
          original_decision: originalDecision.decision,
          override_decision,
          reason,
          remember_preference,
        });
      }

      // Process learning if user chose "Remember this"
      await processOverride(
        DEFAULT_USER_ID,
        request_id,
        originalDecision.decision,
        override_decision,
        reason,
        remember_preference
      );

      return reply.send({
        request_id,
        decision: override_decision,
        remembered: remember_preference,
        status: 'completed',
      });
    }
  );

  // GET /api/v1/decisions — List all decisions for the user
  fastify.get('/api/v1/decisions', async (request, reply) => {
    const { data, error } = await getSupabase()
      .from('decision_requests')
      .select(`
        *,
        agents (id, name, description)
      `)
      .eq('user_id', DEFAULT_USER_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    // For each request, get the decision
    const results = await Promise.all(
      (data || []).map(async (req: any) => {
        const decision = await getDecisionByRequestId(req.request_id);
        return {
          ...req,
          decision_result: decision,
        };
      })
    );

    return reply.send(results);
  });
}
