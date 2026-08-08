// ============================================================
// Preference Routes — CRUD for user preferences
// ============================================================

import { FastifyInstance } from 'fastify';
import {
  getUserPreferences,
  getPreference,
  createPreference,
  updatePreference,
  archivePreference,
  deletePreference,
  getPreferenceHistory,
  getPendingSuggestions,
  resolveSuggestion,
} from '../services/preference-service';
import { PreferenceSource, PreferenceStatus, SuggestionStatus } from '@humanapi/shared';
import { getSupabase } from '../db/supabase';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function preferenceRoutes(fastify: FastifyInstance) {
  // GET /api/v1/preferences — List preferences
  fastify.get<{ Querystring: { category?: string; status?: string } }>(
    '/api/v1/preferences',
    async (request, reply) => {
      const { category, status } = request.query;
      const prefs = await getUserPreferences(
        DEFAULT_USER_ID,
        category,
        status as PreferenceStatus | undefined
      );
      return reply.send(prefs);
    }
  );

  // GET /api/v1/preferences/:id — Get single preference
  fastify.get<{ Params: { id: string } }>('/api/v1/preferences/:id', async (request, reply) => {
    const pref = await getPreference(request.params.id);
    if (!pref) return reply.code(404).send({ error: 'Preference not found' });
    return reply.send(pref);
  });

  // POST /api/v1/preferences — Create preference
  fastify.post<{
    Body: {
      category: string;
      key: string;
      value: any;
      source?: string;
      confidence?: number;
      importance?: string;
      status?: string;
    };
  }>('/api/v1/preferences', async (request, reply) => {
    const { category, key, value, source, confidence, importance, status } = request.body;
    const pref = await createPreference(
      DEFAULT_USER_ID,
      category,
      key,
      value,
      (source as PreferenceSource) || PreferenceSource.USER_EXPLICIT,
      confidence ?? 1.0,
      importance || 'MEDIUM',
      (status as PreferenceStatus) || PreferenceStatus.ACTIVE
    );
    return reply.code(201).send(pref);
  });

  // PUT /api/v1/preferences/:id — Update preference
  fastify.put<{
    Params: { id: string };
    Body: {
      value?: any;
      source?: string;
      confidence?: number;
      importance?: string;
      status?: string;
    };
  }>('/api/v1/preferences/:id', async (request, reply) => {
    const updates: any = {};
    if (request.body.value !== undefined) updates.value = request.body.value;
    if (request.body.source) updates.source = request.body.source;
    if (request.body.confidence !== undefined) updates.confidence = request.body.confidence;
    if (request.body.importance) updates.importance = request.body.importance;
    if (request.body.status) updates.status = request.body.status;

    const pref = await updatePreference(request.params.id, updates);
    return reply.send(pref);
  });

  // DELETE /api/v1/preferences/:id — Archive preference
  fastify.delete<{ Params: { id: string } }>('/api/v1/preferences/:id', async (request, reply) => {
    await archivePreference(request.params.id);
    return reply.code(204).send();
  });

  // DELETE /api/v1/preferences/:id/permanent — Permanently delete
  fastify.delete<{ Params: { id: string } }>(
    '/api/v1/preferences/:id/permanent',
    async (request, reply) => {
      await deletePreference(request.params.id);
      return reply.code(204).send();
    }
  );

  // GET /api/v1/preferences/:id/history — Version history
  fastify.get<{ Params: { id: string } }>(
    '/api/v1/preferences/:id/history',
    async (request, reply) => {
      const history = await getPreferenceHistory(request.params.id);
      return reply.send(history);
    }
  );

  // --- Preference Suggestions ---

  // GET /api/v1/suggestions — Pending suggestions
  fastify.get('/api/v1/suggestions', async (request, reply) => {
    const suggestions = await getPendingSuggestions(DEFAULT_USER_ID);
    return reply.send(suggestions);
  });

  // POST /api/v1/suggestions/:id/accept — Accept a suggestion
  fastify.post<{ Params: { id: string } }>(
    '/api/v1/suggestions/:id/accept',
    async (request, reply) => {
      // Get the suggestion
      const { data: suggestion } = await getSupabase()
        .from('preference_suggestions')
        .select('*')
        .eq('id', request.params.id)
        .single();

      if (suggestion) {
        await createPreference(
          DEFAULT_USER_ID,
          suggestion.category,
          suggestion.key,
          suggestion.proposed_value,
          PreferenceSource.USER_CORRECTION,
          suggestion.confidence,
          'MEDIUM',
          PreferenceStatus.ACTIVE
        );
      }

      // Resolve it
      await resolveSuggestion(request.params.id, SuggestionStatus.ACCEPTED);
      return reply.send({ status: 'accepted' });
    }
  );

  // POST /api/v1/suggestions/:id/ignore — Ignore a suggestion
  fastify.post<{ Params: { id: string } }>(
    '/api/v1/suggestions/:id/ignore',
    async (request, reply) => {
      await resolveSuggestion(request.params.id, SuggestionStatus.IGNORED);
      return reply.send({ status: 'ignored' });
    }
  );
}
