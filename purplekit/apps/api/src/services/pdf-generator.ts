import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

// Register handlebars helpers
handlebars.registerHelper('formatDate', (date: Date | string) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

handlebars.registerHelper('formatDateTime', (date: Date | string) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

handlebars.registerHelper('round', (num: number) => {
  return Math.round(num);
});

handlebars.registerHelper('formatSeconds', (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
});

handlebars.registerHelper('eq', (a: any, b: any) => {
  return a === b;
});

handlebars.registerHelper('gt', (a: number, b: number) => {
  return a > b;
});

export async function generateExecutiveSummaryPDF(
  data: any
): Promise<Buffer> {
  const templatePath = join(
    __dirname,
    '../templates/reports/executive-summary.hbs'
  );
  const template = readFileSync(templatePath, 'utf-8');
  const compiled = handlebars.compile(template);
  const html = compiled({ ...data, now: new Date() });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generateTechnicalDetailPDF(data: any): Promise<Buffer> {
  const templatePath = join(
    __dirname,
    '../templates/reports/technical-detail.hbs'
  );
  const template = readFileSync(templatePath, 'utf-8');
  const compiled = handlebars.compile(template);
  const html = compiled({ ...data, now: new Date() });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
