// ============================================================
// Onboarding Routes — AI-assisted preference discovery (PRD §11-12)
// ============================================================

import { FastifyInstance } from 'fastify';
import { onboardingChat, extractPreferences } from '../services/claude-service';
import { createPreference } from '../services/preference-service';
import {
  OnboardingChatRequest,
  OnboardingChatResponse,
  ExtractedPreference,
  PreferenceSource,
  PreferenceStatus,
} from '@humanapi/shared';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function onboardingRoutes(fastify: FastifyInstance) {
  // POST /api/v1/onboarding/chat — Send a message, get AI response + extractions
  fastify.post<{ Body: OnboardingChatRequest }>(
    '/api/v1/onboarding/chat',
    async (request, reply) => {
      const { messages } = request.body;

      // Get AI response
      const { reply: aiReply, is_complete } = await onboardingChat(messages);

      // Extract preferences from conversation so far
      let extracted_preferences: ExtractedPreference[] = [];
      if (is_complete || messages.length >= 6) {
        // Extract after enough conversation or when AI signals completion
        extracted_preferences = await extractPreferences(messages);
      }

      const response: OnboardingChatResponse = {
        reply: aiReply,
        extracted_preferences,
        is_complete,
      };

      return reply.send(response);
    }
  );

  // POST /api/v1/onboarding/confirm — Confirm extracted preferences
  fastify.post<{ Body: { preferences: ExtractedPreference[] } }>(
    '/api/v1/onboarding/confirm',
    async (request, reply) => {
      const { preferences } = request.body;
      const created = [];

      for (const pref of preferences) {
        const result = await createPreference(
          DEFAULT_USER_ID,
          pref.category,
          pref.key,
          pref.value,
          PreferenceSource.USER_EXPLICIT,
          pref.confidence,
          'MEDIUM',
          PreferenceStatus.ACTIVE
        );
        created.push(result);
      }

      return reply.code(201).send({ confirmed: created.length, preferences: created });
    }
  );
}
