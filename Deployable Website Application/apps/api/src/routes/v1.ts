import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  LocaleSchema,
  ScanRequestSchema,
  ScanResponseSchema,
  type HealthResponse,
} from '@scamhisn/shared';
import { config } from '../config.js';
import { SsrfError } from '../security/ssrfGuard.js';
import { runUrlScan } from '../services/scanOrchestrator.js';
import { generateForensicPdf } from '../services/pdfReportGenerator.js';

const PdfReportRequestSchema = z.object({
  report: ScanResponseSchema,
  locale: LocaleSchema.optional().default('en'),
});

export function createV1Router(): Router {
  const router = Router();

  const scanLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many scan requests. Please wait a moment and try again.',
        messageAr: 'وصلت للحد المسموح من الفحوصات مؤقتاً، تريّث شوي وحاول مرة ثانية.',
      },
    },
  });

  router.get('/health', (_req, res) => {
    const payload: HealthResponse = {
      status: 'ok',
      service: 'ScamHisn AI API',
      version: '1.0.0',
      model: config.geminiModel,
      aiConfigured: Boolean(config.geminiApiKey),
      timestamp: new Date().toISOString(),
    };
    res.json(payload);
  });

  router.post('/scan', scanLimiter, async (req, res) => {
    const parsed = ScanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid scan request payload.',
          messageAr: 'البيانات المرسلة غير صالحة. تأكد من إدخال رابط ونوع فحص صحيح.',
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    try {
      const result = await runUrlScan(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof SsrfError) {
        res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            messageAr: err.messageAr,
          },
        });
        return;
      }

      console.error('[ScamHisn API] Unexpected scan error:', err);
      res.status(500).json({
        error: {
          code: 'SCAN_INTERNAL_ERROR',
          message: 'An unexpected error occurred while inspecting the URL.',
          messageAr: 'صار خطأ غير متوقع أثناء فحص الرابط. حاول مرة ثانية.',
        },
      });
    }
  });

  router.post('/report/pdf', scanLimiter, async (req, res) => {
    const parsed = PdfReportRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid report payload for PDF generation.',
          messageAr: 'بيانات التقرير غير صالحة لإنشاء ملف PDF.',
        },
      });
      return;
    }

    try {
      const pdfBuffer = await generateForensicPdf(parsed.data.report, parsed.data.locale);
      const shortId = parsed.data.report.scanId.slice(0, 8).replace(/[^a-zA-Z0-9-]/g, '');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ScamHisn-Report-${shortId || 'forensic'}.pdf"`,
      );
      res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error('[ScamHisn API] PDF generation error:', err);
      res.status(500).json({
        error: {
          code: 'PDF_GENERATION_ERROR',
          message: 'Could not generate PDF forensic report.',
          messageAr: 'تعذّر إنشاء تقرير الـ PDF. حاول مرة ثانية.',
        },
      });
    }
  });

  return router;
}
