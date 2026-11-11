import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import agentHandler from './api/agent.js';

const app = express();
app.use(express.json({ limit: '32kb' }));
app.post('/api/agent', agentHandler);

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
app.use(vite.middlewares);

const port = Number(process.env.TASKMIND_PORT || process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`TaskMind disponível em http://localhost:${port}`);
});
