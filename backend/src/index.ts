// ============================================================
// HumanAPI — Backend Server Entry Point
// ============================================================

import { config } from './config';
import { buildApp } from './app';

async function main() {
  const fastify = await buildApp();

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
