// ============================================================
// HumanAPI — Backend Server Entry Point
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { decisionRoutes } from './routes/decisions';
import { agentRoutes } from './routes/agents';
import { preferenceRoutes } from './routes/preferences';
import { policyRoutes } from './routes/policies';
import { onboardingRoutes } from './routes/onboarding';
import { userRoutes } from './routes/users';

async function main() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
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

  // Start server
  try {
    await fastify.listen({ port: config.server.port, host: config.server.host });
    console.log(`
╔══════════════════════════════════════════════╗
║          🧠 HumanAPI Server Ready           ║
║                                              ║
║  Port: ${config.server.port}                             ║
║  API:  http://localhost:${config.server.port}/api/v1      ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
