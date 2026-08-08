import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { decisionRoutes } from './routes/decisions';
import { agentRoutes } from './routes/agents';
import { preferenceRoutes } from './routes/preferences';
import { policyRoutes } from './routes/policies';
import { onboardingRoutes } from './routes/onboarding';
import { userRoutes } from './routes/users';

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
    ...opts,
  });

  // CORS
  await fastify.register(cors, {
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'humanapi' }));

  // Register all routes
  await fastify.register(decisionRoutes);
  await fastify.register(agentRoutes);
  await fastify.register(preferenceRoutes);
  await fastify.register(policyRoutes);
  await fastify.register(onboardingRoutes);
  await fastify.register(userRoutes);

  return fastify;
}
