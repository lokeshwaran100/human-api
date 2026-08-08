"use strict";
// ============================================================
// Preference Routes — CRUD for user preferences
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferenceRoutes = preferenceRoutes;
const preference_service_1 = require("../services/preference-service");
const shared_1 = require("@humanapi/shared");
const supabase_1 = require("../db/supabase");
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
async function preferenceRoutes(fastify) {
    // GET /api/v1/preferences — List preferences
    fastify.get('/api/v1/preferences', async (request, reply) => {
        const { category, status } = request.query;
        const prefs = await (0, preference_service_1.getUserPreferences)(DEFAULT_USER_ID, category, status);
        return reply.send(prefs);
    });
    // GET /api/v1/preferences/:id — Get single preference
    fastify.get('/api/v1/preferences/:id', async (request, reply) => {
        const pref = await (0, preference_service_1.getPreference)(request.params.id);
        if (!pref)
            return reply.code(404).send({ error: 'Preference not found' });
        return reply.send(pref);
    });
    // POST /api/v1/preferences — Create preference
    fastify.post('/api/v1/preferences', async (request, reply) => {
        const { category, key, value, source, confidence, importance, status } = request.body;
        const pref = await (0, preference_service_1.createPreference)(DEFAULT_USER_ID, category, key, value, source || shared_1.PreferenceSource.USER_EXPLICIT, confidence ?? 1.0, importance || 'MEDIUM', status || shared_1.PreferenceStatus.ACTIVE);
        return reply.code(201).send(pref);
    });
    // PUT /api/v1/preferences/:id — Update preference
    fastify.put('/api/v1/preferences/:id', async (request, reply) => {
        const updates = {};
        if (request.body.value !== undefined)
            updates.value = request.body.value;
        if (request.body.source)
            updates.source = request.body.source;
        if (request.body.confidence !== undefined)
            updates.confidence = request.body.confidence;
        if (request.body.importance)
            updates.importance = request.body.importance;
        if (request.body.status)
            updates.status = request.body.status;
        const pref = await (0, preference_service_1.updatePreference)(request.params.id, updates);
        return reply.send(pref);
    });
    // DELETE /api/v1/preferences/:id — Archive preference
    fastify.delete('/api/v1/preferences/:id', async (request, reply) => {
        await (0, preference_service_1.archivePreference)(request.params.id);
        return reply.code(204).send();
    });
    // DELETE /api/v1/preferences/:id/permanent — Permanently delete
    fastify.delete('/api/v1/preferences/:id/permanent', async (request, reply) => {
        await (0, preference_service_1.deletePreference)(request.params.id);
        return reply.code(204).send();
    });
    // GET /api/v1/preferences/:id/history — Version history
    fastify.get('/api/v1/preferences/:id/history', async (request, reply) => {
        const history = await (0, preference_service_1.getPreferenceHistory)(request.params.id);
        return reply.send(history);
    });
    // --- Preference Suggestions ---
    // GET /api/v1/suggestions — Pending suggestions
    fastify.get('/api/v1/suggestions', async (request, reply) => {
        const suggestions = await (0, preference_service_1.getPendingSuggestions)(DEFAULT_USER_ID);
        return reply.send(suggestions);
    });
    // POST /api/v1/suggestions/:id/accept — Accept a suggestion
    fastify.post('/api/v1/suggestions/:id/accept', async (request, reply) => {
        // Get the suggestion
        const { data: suggestion } = await (0, supabase_1.getSupabase)()
            .from('preference_suggestions')
            .select('*')
            .eq('id', request.params.id)
            .single();
        if (suggestion) {
            await (0, preference_service_1.createPreference)(DEFAULT_USER_ID, suggestion.category, suggestion.key, suggestion.proposed_value, shared_1.PreferenceSource.USER_CORRECTION, suggestion.confidence, 'MEDIUM', shared_1.PreferenceStatus.ACTIVE);
        }
        // Resolve it
        await (0, preference_service_1.resolveSuggestion)(request.params.id, shared_1.SuggestionStatus.ACCEPTED);
        return reply.send({ status: 'accepted' });
    });
    // POST /api/v1/suggestions/:id/ignore — Ignore a suggestion
    fastify.post('/api/v1/suggestions/:id/ignore', async (request, reply) => {
        await (0, preference_service_1.resolveSuggestion)(request.params.id, shared_1.SuggestionStatus.IGNORED);
        return reply.send({ status: 'ignored' });
    });
}
