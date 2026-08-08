// ============================================================
// Auth Middleware — Supabase user auth (placeholder for MVP)
// ============================================================

import { FastifyRequest, FastifyReply } from 'fastify';

// For the MVP, we use a single default user.
// In production, this would validate Supabase Auth tokens.
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // MVP: Allow all dashboard requests (single user mode)
  // In production: validate Supabase JWT from Authorization header
}
