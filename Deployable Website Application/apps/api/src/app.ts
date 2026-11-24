import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { API_V1_PREFIX } from '@scamhisn/shared';
import { config } from './config.js';
import { createV1Router } from './routes/v1.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isAllowedCorsOrigin(origin: string | undefined): boolean {
  // Allow same-origin requests, curl/healthchecks, and server-to-server calls without Origin header
  if (!origin) return true;

  // Browser extensions (Chrome / Edge / Firefox / Safari)
  if (
    config.corsAllowExtensions &&
    (origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://') ||
      origin.startsWith('safari-web-extension://'))
  ) {
    return true;
  }

  // Wildcard or open dev fallback if no explicit origins configured
  if (config.corsAllowedOrigins.length === 0 || config.corsAllowedOrigins.includes('*')) {
    return true;
  }

  return config.corsAllowedOrigins.includes(origin);
}

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin "${origin}" is not allowed`));
        }
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-ScamHisn-Client'],
      maxAge: 86400,
    }),
  );

  app.use(express.json({ limit: '512kb' }));

  // Versioned REST API (shared contract for Web SPA + future browser extensions)
  app.use(API_V1_PREFIX, createV1Router());

  // Serve built frontend static bundle when available (production & Docker single-container deploy)
  const webDistDir = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDistDir)) {
    app.use(express.static(webDistDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(webDistDir, 'index.html'));
    });
  }

  // JSON 404 for unknown API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found.',
        messageAr: 'المسار المطلوب غير موجود.',
      },
    });
  });

  // Global error handler (including CORS rejections & malformed JSON)
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const isCors = err.message.includes('CORS origin');
      res.status(isCors ? 403 : 400).json({
        error: {
          code: isCors ? 'CORS_FORBIDDEN' : 'BAD_REQUEST',
          message: err.message,
        },
      });
    },
  );

  return app;
}
