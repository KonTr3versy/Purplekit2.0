import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';
import {
  aggregateExecutiveSummary,
  aggregateTechnicalDetail,
} from '../services/report-data-aggregator';
import {
  generateExecutiveSummaryPDF,
  generateTechnicalDetailPDF,
} from '../services/pdf-generator';
import {
  generateExecutiveSummaryCSV,
  generateTechnicalDetailCSV,
} from '../services/csv-generator';
import { prisma } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';

export const reportsRouter = Router();

// Apply authentication to all routes
reportsRouter.use(authenticate);

// Generate executive summary report
reportsRouter.post(
  '/engagement/:engagementId/executive-summary',
  requireAnalyst,
  async (req, res, next) => {
    try {
      const { engagementId } = req.params;
      const { format = 'pdf' } = req.query;

      if (!['pdf', 'csv'].includes(format as string)) {
        throw new ValidationError('Format must be either "pdf" or "csv"');
      }

      // Verify engagement exists and user has access
      const engagement = await prisma.engagement.findUnique({
        where: { id: engagementId, orgId: req.user!.orgId },
      });

      if (!engagement) {
        throw new NotFoundError('Engagement not found');
      }

      // Aggregate data
      const data = await aggregateExecutiveSummary(
        prisma,
        engagementId,
        req.user!.orgId
      );

      const filename = `purplekit-executive-summary-${engagement.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'pdf') {
        const pdf = await generateExecutiveSummaryPDF(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.pdf"`
        );
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);
      } else {
        const csv = generateExecutiveSummaryCSV(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.csv"`
        );
        res.send(csv);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Generate technical detail report
reportsRouter.post(
  '/engagement/:engagementId/technical-detail',
  requireAnalyst,
  async (req, res, next) => {
    try {
      const { engagementId } = req.params;
      const { format = 'pdf' } = req.query;

      if (!['pdf', 'csv'].includes(format as string)) {
        throw new ValidationError('Format must be either "pdf" or "csv"');
      }

      // Verify engagement exists and user has access
      const engagement = await prisma.engagement.findUnique({
        where: { id: engagementId, orgId: req.user!.orgId },
      });

      if (!engagement) {
        throw new NotFoundError('Engagement not found');
      }

      // Aggregate data
      const data = await aggregateTechnicalDetail(
        prisma,
        engagementId,
        req.user!.orgId
      );

      const filename = `purplekit-technical-detail-${engagement.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'pdf') {
        const pdf = await generateTechnicalDetailPDF(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.pdf"`
        );
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);
      } else {
        // For CSV, return multiple files as concatenated format
        // TODO: Consider using JSZip for proper multi-file export
        const csvFiles = generateTechnicalDetailCSV(data);
        const combined = Object.entries(csvFiles)
          .map(([name, content]) => `=== ${name} ===\n${content}`)
          .join('\n\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.csv"`
        );
        res.send(combined);
      }
    } catch (error) {
      next(error);
    }
  }
);
