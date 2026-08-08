"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        host: process.env.HOST || '0.0.0.0',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
