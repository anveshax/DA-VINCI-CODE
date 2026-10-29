import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes/apiRoutes.js';
import { db } from './server/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API & Health routes
  app.use(apiRouter);

  if (!isProduction) {
    // In development: mount Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve static build from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AEGIS NEXUS] Master Control Plane listening on http://0.0.0.0:${PORT} (${isProduction ? 'PROD' : 'DEV'})`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n[AEGIS NEXUS] Received ${signal}. Initiating graceful shutdown...`);
    server.close(() => {
      try {
        db.close();
        console.log('[AEGIS NEXUS] Database closed cleanly.');
      } catch (err) {
        console.error('[AEGIS NEXUS] Error closing DB:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('[AEGIS NEXUS] Fatal startup error:', err);
  process.exit(1);
});
