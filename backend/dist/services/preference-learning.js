"use strict";
// ============================================================
// Preference Learning — Corrections → suggestions (PRD §40)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOverride = processOverride;
const supabase_1 = require("../db/supabase");
const shared_1 = require("@humanapi/shared");
const preference_service_1 = require("./preference-service");
const db = () => (0, supabase_1.getSupabase)();
// -----------------------------------------------------------
// Process a user override and optionally create a suggestion
// -----------------------------------------------------------
async function processOverride(userId, requestId, originalDecision, overrideDecision, reason, rememberPreference) {
    if (!rememberPreference)
        return;
    // Get the original request payload to understand context
    const { data: request } = await db()
        .from('decision_requests')
        .select('*')
        .eq('request_id', requestId)
        .single();
    if (!request)
        return;
    const payload = request.payload;
    // Determine what preference change to suggest based on the override
    if (request.decision_type === 'flight_purchase') {
        await generateFlightPreferenceSuggestion(userId, payload, originalDecision, overrideDecision, reason);
    }
}
async function generateFlightPreferenceSuggestion(userId, payload, originalDecision, overrideDecision, reason) {
    // If user approved a flight the system rejected due to price
    if (originalDecision === shared_1.DecisionOutcome.REJECT &&
        overrideDecision === shared_1.DecisionOutcome.APPROVE &&
        payload.price) {
        const price = payload.price;
        const isDirect = payload.stops === 0;
        if (isDirect) {
            await (0, preference_service_1.createSuggestion)(userId, 'travel', 'max_flight_budget', price, `You approved a ₹${price.toLocaleString()} direct flight. Your current budget may be lower. Would you like to update it?`, 0.6, shared_1.PreferenceSource.USER_CORRECTION);
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
                await (0, preference_service_1.createSuggestion)(userId, 'travel', 'preferred_airlines', [...currentAirlines, payload.airline], `You approved a ${payload.airline} flight. Would you like to add it to your preferred airlines?`, 0.5, shared_1.PreferenceSource.USER_CORRECTION);
            }
        }
    }
    // If user overrides ASK_USER to APPROVE for a price range
    if (originalDecision === shared_1.DecisionOutcome.ASK_USER &&
        overrideDecision === shared_1.DecisionOutcome.APPROVE &&
        payload.price) {
        const priceThreshold = Math.ceil(payload.price / 5000) * 5000; // Round up to nearest 5K
        await (0, preference_service_1.createSuggestion)(userId, 'travel', 'willing_to_pay_extra_for_direct', { max_price: priceThreshold, condition: 'direct_flight' }, reason || `You approved a ₹${payload.price.toLocaleString()} flight. Should I remember that you're willing to pay this much?`, 0.55, shared_1.PreferenceSource.USER_CORRECTION);
    }
}
