import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import { FastifyReply, FastifyRequest } from 'fastify';
import { buildApp } from '../src/app';

// Vercel serverless function entrypoint
let app: any;

export default async function (req: any, res: any) {
  if (!app) {
    app = await buildApp({ logger: true });
    await app.ready();
  }
  app.server.emit('request', req, res);
}
