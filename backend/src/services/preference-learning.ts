// ============================================================
// Preference Learning — Corrections → suggestions (PRD §40)
// ============================================================

import { getSupabase } from '../db/supabase';
import {
  PreferenceSource,
  DecisionOutcome,
} from '@humanapi/shared';
import { createSuggestion } from './preference-service';

const db = () => getSupabase();

// -----------------------------------------------------------
// Process a user override and optionally create a suggestion
// -----------------------------------------------------------
export async function processOverride(
  userId: string,
  requestId: string,
  originalDecision: DecisionOutcome,
  overrideDecision: DecisionOutcome,
  reason: string | undefined,
  rememberPreference: boolean
): Promise<void> {
  if (!rememberPreference) return;

  // Get the original request payload to understand context
  const { data: request } = await db()
    .from('decision_requests')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (!request) return;

  const payload = request.payload as Record<string, any>;

  // Determine what preference change to suggest based on the override
  if (request.decision_type === 'flight_purchase') {
    await generateFlightPreferenceSuggestion(
      userId,
      payload,
      originalDecision,
      overrideDecision,
      reason
    );
  }
}

async function generateFlightPreferenceSuggestion(
  userId: string,
  payload: Record<string, any>,
  originalDecision: DecisionOutcome,
  overrideDecision: DecisionOutcome,
  reason?: string
): Promise<void> {
  // If user approved a flight the system rejected due to price
  if (
    originalDecision === DecisionOutcome.REJECT &&
    overrideDecision === DecisionOutcome.APPROVE &&
    payload.price
  ) {
    const price = payload.price;
    const isDirect = payload.stops === 0;

    if (isDirect) {
      await createSuggestion(
        userId,
        'travel',
        'max_flight_budget',
        price,
        `You approved a ₹${price.toLocaleString()} direct flight. Your current budget may be lower. Would you like to update it?`,
        0.6,
        PreferenceSource.USER_CORRECTION
      );
    }

    if (payload.airline) {
      // Check if this airline preference exists
      const { data: existing } = await db()
        .from('preferences')
        .select('value')
        .eq('user_id', userId)
        .eq('category', 'travel')
        .eq('key', 'preferred_airlines')
        .single();

      const currentAirlines = existing?.value || [];
      if (!currentAirlines.includes(payload.airline)) {
        await createSuggestion(
          userId,
          'travel',
          'preferred_airlines',
          [...currentAirlines, payload.airline],
          `You approved a ${payload.airline} flight. Would you like to add it to your preferred airlines?`,
          0.5,
          PreferenceSource.USER_CORRECTION
        );
      }
    }
  }

  // If user overrides ASK_USER to APPROVE for a price range
  if (
    originalDecision === DecisionOutcome.ASK_USER &&
    overrideDecision === DecisionOutcome.APPROVE &&
    payload.price
  ) {
    const priceThreshold = Math.ceil(payload.price / 5000) * 5000; // Round up to nearest 5K
    await createSuggestion(
      userId,
      'travel',
      'willing_to_pay_extra_for_direct',
      { max_price: priceThreshold, condition: 'direct_flight' },
      reason || `You approved a ₹${payload.price.toLocaleString()} flight. Should I remember that you're willing to pay this much?`,
      0.55,
      PreferenceSource.USER_CORRECTION
    );
  }
}
