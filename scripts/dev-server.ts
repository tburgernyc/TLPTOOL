import 'dotenv/config';
import express from 'express';
import { createServer } from 'vite';
// @ts-ignore - Importing TS file directly requires ts-node/tsx handling which we have
import handler from '../api/gemini';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log('Starting local dev server...');

  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Parse JSON bodies (needed for the API)
  app.use(express.json());

  // API Route
  app.post('/api/gemini', async (req, res) => {
    try {
      // Mock Vercel-like behavior if needed, but Express req/res is close enough
      await handler(req, res);
    } catch (e) {
      console.error('API Error:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`\n  ➜  Local Server:   http://localhost:${PORT}`);
    console.log(`  ➜  API Endpoint:   http://localhost:${PORT}/api/gemini`);
    console.log(`\n  Ready to work!\n`);
  });
}

startServer();
