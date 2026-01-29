import 'dotenv/config';
import express from 'express';
import { createServer } from 'vite';
// @ts-ignore - Importing TS file directly requires ts-node/tsx handling which we have
import geminiHandler from '../api/gemini';
// @ts-ignore
import healthHandler from '../api/health';

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

  // API Routes
  app.post('/api/gemini', async (req, res) => {
    try {
      await geminiHandler(req, res);
    } catch (e) {
      console.error('API Error (Gemini):', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/health', async (req, res) => {
    try {
      await healthHandler(req, res);
    } catch (e) {
      console.error('API Error (Health):', e);
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
