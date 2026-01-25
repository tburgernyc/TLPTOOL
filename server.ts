import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import apiHandler from './api/gemini';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function start() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Middleware to parse JSON body (required for API handler)
  app.use(express.json());

  // API Route
  app.post('/api/gemini', async (req, res) => {
    try {
      await apiHandler(req, res);
    } catch (e) {
      console.error('API Handler failed', e);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  // Create Vite server in middleware mode and configure the app type as 'spa'
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  // If you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`  ➜  Local Dev Server listening at http://localhost:${port}`);
    console.log(`  ➜  API Proxy active at http://localhost:${port}/api/gemini`);
  });
}

start();
