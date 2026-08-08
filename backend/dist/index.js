"use strict";
// ============================================================
// HumanAPI — Backend Server Entry Point
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
async function main() {
    const fastify = await (0, app_1.buildApp)();
    // Start server
    try {
        await fastify.listen({ port: config_1.config.server.port, host: config_1.config.server.host });
        console.log(`
╔══════════════════════════════════════════════╗
║          🧠 HumanAPI Server Ready           ║
║                                              ║
║  Port: ${config_1.config.server.port}                             ║
║  API:  http://localhost:${config_1.config.server.port}/api/v1      ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
main();
