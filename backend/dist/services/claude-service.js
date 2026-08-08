"use strict";
// ============================================================
// Claude Service — AI reasoning for decisions and preference extraction
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDecision = makeDecision;
exports.extractPreferences = extractPreferences;
exports.onboardingChat = onboardingChat;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("../config");
const shared_1 = require("@humanapi/shared");
let anthropic;
function getClient() {
    if (!anthropic) {
        anthropic = new sdk_1.default({ apiKey: config_1.config.anthropic.apiKey });
    }
    return anthropic;
}
const MODEL = 'claude-sonnet-4-20250514';
// -----------------------------------------------------------
// Decision Reasoning — PRD §51
// -----------------------------------------------------------
const DECISION_SYSTEM_PROMPT = `You are the Personal Decision Agent for a user.

Your job is to determine what decision the user would make based on their explicit preferences, policies and available context.

You MUST follow hard policies.

You MUST NOT invent preferences.

You MUST NOT override permissions.

You MUST protect private user information.

Explicit user preferences have higher priority than inferred preferences.

If there is insufficient information to confidently make a decision, return ASK_USER.

Possible decisions:
APPROVE
REJECT
ASK_USER

Return ONLY valid JSON with these required fields:
{
  "decision": "APPROVE" | "REJECT" | "ASK_USER",
  "confidence": <number 0-1>,
  "reason": "<human-readable explanation>",
  "matched_preferences": ["<list of matched preference keys>"],
  "matched_policies": ["<list of matched policy names>"],
  "requires_user_action": <boolean>
}`;
async function makeDecision(request, preferences, policies) {
    const client = getClient();
    const userMessage = `
## Decision Request

Type: ${request.decision_type}
Agent: ${request.agent_id}

## Request Payload
${JSON.stringify(request.payload, null, 2)}

## User Preferences
${preferences.map(p => `- ${p.key}: ${JSON.stringify(p.value)} (source: ${p.source}, confidence: ${p.confidence}, importance: ${p.importance})`).join('\n')}

## Active Policies
${policies.map(p => `- ${p.name}: conditions=${JSON.stringify(p.conditions)}, action=${p.action}, priority=${p.priority}`).join('\n')}

## Instructions
Evaluate this request against the user's preferences and any remaining policies. Return your decision as valid JSON.`;
    try {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            system: DECISION_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        return parseDecisionResponse(text);
    }
    catch (error) {
        console.error('Claude decision error:', error);
        // PRD §54: Claude unavailable → ASK_USER
        return {
            decision: shared_1.DecisionOutcome.ASK_USER,
            confidence: 0,
            reason: 'AI reasoning service is temporarily unavailable. Requesting human decision.',
            matched_preferences: [],
            matched_policies: [],
            requires_user_action: true,
        };
    }
}
function parseDecisionResponse(text) {
    try {
        // Extract JSON from potential markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonStr = jsonMatch[1]?.trim() || text.trim();
        const parsed = JSON.parse(jsonStr);
        // Validate required fields
        if (!['APPROVE', 'REJECT', 'ASK_USER'].includes(parsed.decision)) {
            throw new Error(`Invalid decision: ${parsed.decision}`);
        }
        return {
            decision: parsed.decision,
            confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
            reason: parsed.reason || 'No reason provided.',
            matched_preferences: parsed.matched_preferences || [],
            matched_policies: parsed.matched_policies || [],
            requires_user_action: parsed.requires_user_action ?? (parsed.decision === 'ASK_USER'),
        };
    }
    catch (error) {
        console.error('Failed to parse Claude response:', error, 'Raw:', text);
        // PRD §54: invalid JSON → ASK_USER
        return {
            decision: shared_1.DecisionOutcome.ASK_USER,
            confidence: 0,
            reason: 'Unable to process AI reasoning. Requesting human decision.',
            matched_preferences: [],
            matched_policies: [],
            requires_user_action: true,
        };
    }
}
// -----------------------------------------------------------
// Preference Extraction — PRD §52
// -----------------------------------------------------------
const EXTRACTION_SYSTEM_PROMPT = `You are a preference extraction agent. Your job is to identify structured preferences from natural language conversations.

Rules:
1. Identify explicit user statements.
2. Convert them into structured preferences.
3. Distinguish preferences (soft constraints) from hard policies.
4. Assign confidence based on how explicit the statement is.
5. Identify ambiguity.
6. Never invent missing values.
7. Return proposed changes rather than active preferences.

Travel preference keys you should extract:
- preferred_airlines (array of airline names)
- avoid_airlines (array of airline names)
- max_flight_budget (number in INR)
- max_stops (number)
- preferred_seat (string: aisle, window, middle)
- preferred_cabin (string: economy, premium_economy, business, first)
- preferred_departure_time (string: morning, afternoon, evening, night, red_eye)
- max_flight_duration (string like "12 hours")
- prefer_direct_flights (boolean)
- preferred_airports (array of airport codes)
- baggage_requirement (string)

Return ONLY valid JSON:
{
  "proposals": [
    {
      "category": "travel",
      "key": "<key from list above>",
      "value": <appropriate typed value>,
      "type": "preference" or "policy",
      "source": "USER_EXPLICIT",
      "confidence": <0-1>,
      "display_label": "<human readable label>"
    }
  ]
}`;
async function extractPreferences(messages) {
    const client = getClient();
    const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
        .join('\n');
    try {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: EXTRACTION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Extract structured preferences from this conversation:\n\n${conversationText}`,
                },
            ],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        const jsonStr = jsonMatch[1]?.trim() || text.trim();
        const parsed = JSON.parse(jsonStr);
        return (parsed.proposals || []).map((p) => ({
            category: p.category || 'travel',
            key: p.key,
            value: p.value,
            type: p.type || 'preference',
            source: p.source || 'USER_EXPLICIT',
            confidence: Math.max(0, Math.min(1, p.confidence || 0.8)),
            display_label: p.display_label || p.key,
        }));
    }
    catch (error) {
        console.error('Claude extraction error:', error);
        return [];
    }
}
// -----------------------------------------------------------
// Onboarding Chat — conversational AI for preference discovery
// -----------------------------------------------------------
const ONBOARDING_SYSTEM_PROMPT = `You are the Personal Agent onboarding assistant. Your job is to learn about the user's travel preferences through a friendly, natural conversation.

Ask about:
1. What matters most when choosing flights (price, convenience, airline preference)
2. Budget range for flights
3. Airline preferences or airlines to avoid
4. Seat preferences (aisle, window, etc.)
5. Cabin class preference
6. Preference for direct flights vs connections
7. Maximum acceptable number of stops
8. Departure time preferences

Guidelines:
- Be warm and conversational, not robotic
- Ask 2-3 questions at a time maximum
- Acknowledge what the user says before asking more
- After gathering enough information (usually 3-4 exchanges), indicate that you have a good understanding
- Keep responses concise (2-4 sentences)

If you feel you have gathered enough preferences, end your message with the exact marker: [ONBOARDING_COMPLETE]`;
async function onboardingChat(messages) {
    const client = getClient();
    const claudeMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
    }));
    try {
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: ONBOARDING_SYSTEM_PROMPT,
            messages: claudeMessages,
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const is_complete = text.includes('[ONBOARDING_COMPLETE]');
        const reply = text.replace('[ONBOARDING_COMPLETE]', '').trim();
        return { reply, is_complete };
    }
    catch (error) {
        console.error('Claude onboarding error:', error);
        return {
            reply: "I'm having trouble connecting right now. Could you try again in a moment?",
            is_complete: false,
        };
    }
}
