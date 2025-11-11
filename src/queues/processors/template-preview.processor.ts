import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as puppeteer from 'puppeteer';
import { GENERATE_TEMPLATE_PREVIEW_QUEUE } from '../../common/constants/queues.constant';
import { uploadToS3 } from '../../helpers/aws-s3.helper';
import prisma from '../../common/prisma';

@Processor(GENERATE_TEMPLATE_PREVIEW_QUEUE)
export class TemplatePreviewQueueProcessor {
  private readonly logger = new Logger(TemplatePreviewQueueProcessor.name);

  @Process('generate-preview')
  async handleGeneratePreview(job: Job<any>) {
    const { templateVersionId, html } = job.data;

    try {
      this.logger.log(`Generating preview for template version ID ${templateVersionId}`);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 600 });

      // Wrap HTML in a complete document with white background
      const wrappedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                background-color: white;
                width: 100%;
                min-height: 100vh;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;

      await page.setContent(wrappedHtml, { waitUntil: 'networkidle0' });

      const screenshot = await page.screenshot({
        type: 'png',
        omitBackground: false,
      });
      await browser.close();

      this.logger.log(`Screenshot captured for template version ID ${templateVersionId}`);

      const s3Bucket = process.env.AWS_S3_BUCKET || 'byteinbox-templates';
      const s3Key = `previews/${templateVersionId}-${Date.now()}.png`;

      const previewUrl = await uploadToS3({
        bucket: s3Bucket,
        key: s3Key,
        body: screenshot as Buffer,
        contentType: 'image/png',
      });

      this.logger.log(`Preview uploaded to S3: ${previewUrl}`);

      await prisma.templateVersion.update({
        where: { id: templateVersionId },
        data: { previewUrl },
      });

      this.logger.log(`Template version ${templateVersionId} updated with preview URL`);
    } catch (error) {
      this.logger.error(
        `Failed to generate preview for template version ${templateVersionId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
