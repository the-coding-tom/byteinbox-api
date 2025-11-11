import { Injectable } from '@nestjs/common';
import { TemplateVersionStatus } from '@prisma/client';
import prisma from '../common/prisma';
import { LatestTemplateVersionData } from './entities/template.entity';

@Injectable()
export class TemplateVersionRepository {
  async incrementOpens(versionId: number): Promise<void> {
    await prisma.templateVersion.update({
      where: { id: versionId },
      data: {
        opens: {
          increment: 1,
        },
      },
    });
  }

  async incrementClicks(versionId: number): Promise<void> {
    await prisma.templateVersion.update({
      where: { id: versionId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }

  async findLatestVersionByTemplateReference(reference: string, teamId: number): Promise<LatestTemplateVersionData> {
    const [row]: any[] = await prisma.$queryRaw`
      SELECT
        t.id AS template_id,
        tv.id AS version_id,
        tv.status
      FROM templates t
      INNER JOIN template_versions tv ON tv.template_id = t.id
      WHERE t.reference = ${reference} AND t.team_id = ${teamId}
      ORDER BY tv.version_number DESC
      LIMIT 1
    `;

    return row;
  }

  async publishVersion(templateId: number, versionId: number, publishedBy?: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const updatedVersion = await tx.templateVersion.update({
        where: { id: versionId },
        data: {
          status: TemplateVersionStatus.published,
          publishedAt: new Date(),
          publishedBy,
        },
      });

      await tx.template.update({
        where: { id: templateId },
        data: {
          currentVersionId: updatedVersion.id,
        },
      });
    });
  }

  /**
   * Get fallback variables for a template version as a key-value object
   * Returns variables in the format: { variableKey: fallbackValue }
   */
  async getFallbackVariables(versionId: number): Promise<Record<string, any>> {
    const [result] = await prisma.$queryRaw<Array<Record<string, any>>>`
      SELECT COALESCE(
        json_object_agg(key, fallback_value) FILTER (WHERE fallback_value IS NOT NULL),
        '{}'::json
      )
      FROM template_variables
      WHERE template_version_id = ${versionId}
    `;

    return result;
  }
}

