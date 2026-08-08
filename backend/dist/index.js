"use strict";
// ============================================================
// HumanAPI — Backend Server Entry Point
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const config_1 = require("./config");
const decisions_1 = require("./routes/decisions");
const agents_1 = require("./routes/agents");
const preferences_1 = require("./routes/preferences");
const policies_1 = require("./routes/policies");
const onboarding_1 = require("./routes/onboarding");
const users_1 = require("./routes/users");
async function main() {
    const fastify = (0, fastify_1.default)({
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: { colorize: true },
            },
        },
    });
    // CORS
    await fastify.register(cors_1.default, {
        origin: config_1.config.frontendUrl,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    // Health check
    fastify.get('/health', async () => ({ status: 'ok', service: 'humanapi' }));
    // Register all routes
    await fastify.register(decisions_1.decisionRoutes);
    await fastify.register(agents_1.agentRoutes);
    await fastify.register(preferences_1.preferenceRoutes);
    await fastify.register(policies_1.policyRoutes);
    await fastify.register(onboarding_1.onboardingRoutes);
    await fastify.register(users_1.userRoutes);
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
