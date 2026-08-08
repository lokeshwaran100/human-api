"use strict";
// ============================================================
// Auth Middleware — Supabase user auth (placeholder for MVP)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
// For the MVP, we use a single default user.
// In production, this would validate Supabase Auth tokens.
async function authMiddleware(request, reply) {
    // MVP: Allow all dashboard requests (single user mode)
    // In production: validate Supabase JWT from Authorization header
}
