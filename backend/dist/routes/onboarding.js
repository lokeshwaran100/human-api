"use strict";
// ============================================================
// Onboarding Routes — AI-assisted preference discovery (PRD §11-12)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingRoutes = onboardingRoutes;
const claude_service_1 = require("../services/claude-service");
const preference_service_1 = require("../services/preference-service");
const shared_1 = require("@humanapi/shared");
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
async function onboardingRoutes(fastify) {
    // POST /api/v1/onboarding/chat — Send a message, get AI response + extractions
    fastify.post('/api/v1/onboarding/chat', async (request, reply) => {
        const { messages } = request.body;
        // Get AI response
        const { reply: aiReply, is_complete } = await (0, claude_service_1.onboardingChat)(messages);
        // Extract preferences from conversation so far
        let extracted_preferences = [];
        if (is_complete || messages.length >= 6) {
            // Extract after enough conversation or when AI signals completion
            extracted_preferences = await (0, claude_service_1.extractPreferences)(messages);
        }
        const response = {
            reply: aiReply,
            extracted_preferences,
            is_complete,
        };
        return reply.send(response);
    });
    // POST /api/v1/onboarding/confirm — Confirm extracted preferences
    fastify.post('/api/v1/onboarding/confirm', async (request, reply) => {
        const { preferences } = request.body;
        const created = [];
        for (const pref of preferences) {
            const result = await (0, preference_service_1.createPreference)(DEFAULT_USER_ID, pref.category, pref.key, pref.value, shared_1.PreferenceSource.USER_EXPLICIT, pref.confidence, 'MEDIUM', shared_1.PreferenceStatus.ACTIVE);
            created.push(result);
        }
        return reply.code(201).send({ confirmed: created.length, preferences: created });
    });
}
