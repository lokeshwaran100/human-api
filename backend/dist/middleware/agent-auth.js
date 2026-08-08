"use strict";
// ============================================================
// Agent Auth Middleware — API key validation (PRD §49)
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentAuthMiddleware = agentAuthMiddleware;
const supabase_1 = require("../db/supabase");
const crypto_1 = __importDefault(require("crypto"));
async function agentAuthMiddleware(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer hapi_')) {
        reply.code(401).send({ error: 'Missing or invalid API key' });
        return;
    }
    const apiKey = authHeader.replace('Bearer ', '');
    const apiKeyHash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
    const { data: agent } = await (0, supabase_1.getSupabase)()
        .from('agents')
        .select('id, status')
        .eq('api_key_hash', apiKeyHash)
        .single();
    if (!agent || agent.status !== 'ACTIVE') {
        reply.code(401).send({ error: 'Invalid or revoked API key' });
        return;
    }
    // Attach agent info to request
    request.agentId = agent.id;
}
