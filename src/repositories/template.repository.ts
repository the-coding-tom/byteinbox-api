import { Injectable } from '@nestjs/common';
import { TemplateStatus, TemplateVersionStatus, Prisma } from '@prisma/client';
import prisma from '../common/prisma';
import { CreateTemplateData, FindTemplatesWithFilterData, UpdateTemplateData, DuplicateTemplateData } from './entities/template.entity';

@Injectable()
export class TemplateRepository {
  async create(data: CreateTemplateData): Promise<{ reference: string; versionId: number; html: string }> {
    // Create template with first version
    const template = await prisma.template.create({
      data: {
        name: data.name,
        description: data.description,
        alias: data.alias,
        createdBy: data.createdBy,
        teamId: data.teamId,
        status: TemplateStatus.active,
        versions: {
          create: {
            versionNumber: data.versionNumber,
            html: data.html,
            subject: data.subject,
            category: data.category,
            from: data.from,
            replyTo: data.replyTo || [],
            text: data.text,
            status: TemplateVersionStatus.draft,
            createdBy: data.createdBy,
            variables: {
              createMany: {
                data: data.variables,
              },
            },
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return {
      reference: template.reference,
      versionId: template.versions[0].id,
      html: template.versions[0].html,
    };
  }

  async findById(id: number, teamId: number): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        id,
        teamId,
      },
      include: {
        CurrentVersion: {
          include: {
            variables: true,
          },
        },
      },
    });
  }


  async findByReference(reference: string, teamId: number): Promise<any | undefined> {
    const [row] = await prisma.$queryRaw<any[]>`
      SELECT
        t.reference AS id,
        tv.reference AS "currentVersionId",
        t.alias,
        t.name,
        t.description,
        tv.subject,
        to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
        tv.status,
        CASE WHEN tv.published_at IS NOT NULL
          THEN to_char(tv.published_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ELSE NULL END AS "publishedAt",
        tv.from,
        CASE WHEN array_length(tv.reply_to, 1) IS NULL OR array_length(tv.reply_to, 1) = 0
          THEN NULL ELSE tv.reply_to END AS "replyTo",
        tv.html,
        tv.text,
        tv.preview_url AS "previewUrl",
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', tvv.reference,
            'key', tvv.key,
            'type', tvv.type,
            'fallbackValue', tvv.fallback_value,
            'createdAt', to_char(tvv.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'updatedAt', to_char(tvv.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) ORDER BY tvv.created_at ASC)
          FROM template_variables tvv
          WHERE tvv.template_version_id = tv.id
        ), '[]'::json) AS variables,
        (
          SELECT (COUNT(*) > 0)::boolean
          FROM template_versions tv_draft
          WHERE tv_draft.template_id = t.id
          AND tv_draft.status = 'draft'
        ) AS "hasUnpublishedVersions"
      FROM templates t
      INNER JOIN template_versions tv ON tv.id = COALESCE(
        t.current_version_id,
        (SELECT tv2.id FROM template_versions tv2
         WHERE tv2.template_id = t.id
         ORDER BY tv2.version_number DESC LIMIT 1)
      )
      WHERE t.reference = ${reference} AND t.team_id = ${teamId}
      LIMIT 1;
    `;

    return row;
  }

  async findByNameAndTeam(name: string, teamId: number): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        name,
        teamId,
        status: { not: TemplateStatus.deleted },
      },
      select: {
        id: true,
        reference: true,
      },
    });
  }

  /**
   * Find template by name or reference (flexible lookup for user-facing APIs)
   * Returns template with current version details needed for rendering
   */
  async findByNameOrReference(nameOrReference: string, teamId: number): Promise<any | null> {
    return prisma.template.findFirst({
      where: {
        teamId,
        status: TemplateStatus.active,
        OR: [
          { name: nameOrReference },
          { reference: nameOrReference },
        ],
      },
      include: {
        CurrentVersion: {
          include: {
            variables: true,
          },
        },
      },
    });
  }

  async findWithFilter(filter: FindTemplatesWithFilterData): Promise<{ data: any[]; total: number; offset: number; limit: number }> {
    const { teamId, keyword, category, status, offset, limit } = filter;

    const whereClause = Prisma.sql`
      WHERE T.team_id = ${teamId}
      AND (
        T.name::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR TV.subject::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR T.description::text ILIKE CONCAT('%', ${keyword ?? ''}::text, '%')
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (
        CASE
          WHEN ${status} = 'active' THEN T.status = 'active'
          WHEN ${status} = 'archived' THEN T.status = 'archived'
          WHEN ${status} = 'deleted' THEN T.status = 'deleted'
          ELSE TRUE
        END
      )
      AND (
        TV.category::text = ${category ?? ''}::text
        OR COALESCE(${category}, NULL) IS NULL
      )
    `;

    const retrieveTemplatesQuery = Prisma.sql`
      SELECT
        T.reference as id,
        T.alias,
        T.name,
        T.description,
        TV.subject,
        TV.category,
        T.status,
        COALESCE(TV.opens, 0) as opens,
        COALESCE(TV.clicks, 0) as clicks,
        T.created_at as "createdAt",
        T.updated_at as "lastModified"
      FROM templates T
      LEFT JOIN template_versions TV ON T.current_version_id = TV.id
      ${whereClause}
      ORDER BY T.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countTemplatesQuery = Prisma.sql`
      SELECT COUNT(*)::int
      FROM templates T
      LEFT JOIN template_versions TV ON T.current_version_id = TV.id
      ${whereClause}
    `;

    const templates: any[] = await prisma.$queryRaw(retrieveTemplatesQuery);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countTemplatesQuery);

    return {
      data: templates,
      total: count,
      offset,
      limit,
    };
  }

  async update(templateId: number, data: UpdateTemplateData): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // Update template
      await tx.template.update({
        where: { id: templateId },
        data: {
          name: data.name,
          description: data.description,
          alias: data.alias,
        },
      });

      // Create new version
      return tx.templateVersion.create({
        data: {
          templateId,
          html: data.html,
          text: data.text,
          subject: data.subject,
          from: data.from,
          replyTo: data.replyTo || [],
          status: TemplateVersionStatus.draft,
          createdBy: data.createdBy,
          variables: {
            create: data.variables,
          },
        },
        include: {
          variables: true,
        },
      });
    });
  }

  async delete(reference: string, teamId: number): Promise<any> {
    return await prisma.template.deleteMany({
      where: {
        reference,
        teamId,
      },
    });
  }

  async duplicate(data: DuplicateTemplateData, teamId: number, createdBy: number, versionNumber: number): Promise<{ reference: string }> {
    const duplicatedTemplate = await prisma.template.create({
      data: {
        name: data.name,
        description: data.description,
        alias: data.alias,
        createdBy,
        teamId,
        status: TemplateStatus.active,
        versions: {
          create: {
            versionNumber,
            html: data.html,
            text: data.text,
            subject: data.subject,
            category: data.category,
            from: data.from,
            replyTo: data.replyTo || [],
            status: TemplateVersionStatus.draft,
            createdBy,
            variables: {
              createMany: {
                data: data.variables,
              },
            },
          },
        },
      },
    });

    return {
      reference: duplicatedTemplate.reference,
    };
  }

  /**
   * Find templates with published versions by multiple names/references for a team (bulk validation)
   * Returns a map of template identifiers to template data for quick O(1) lookup
   */
  async findPublishedTemplatesByNamesAndTeam(templateIdentifiers: string[], teamId: number): Promise<Record<string, { id: number; name: string; reference: string }>> {
    const templates = await prisma.$queryRaw<Array<{ id: number; name: string; reference: string }>>`
      SELECT t.id, t.name, t.reference
      FROM templates t
      INNER JOIN template_versions tv ON tv.id = t.current_version_id
      WHERE (t.name = ANY(${templateIdentifiers}::text[]) OR t.reference = ANY(${templateIdentifiers}::text[]))
        AND t.team_id = ${teamId}
        AND t.status = ${TemplateStatus.active}::"TemplateStatus"
        AND tv.status = ${TemplateVersionStatus.published}::"TemplateVersionStatus"
    `;

    // Convert array to map for O(1) lookup - support both name and reference as keys
    const templateMap: Record<string, { id: number; name: string; reference: string }> = {};
    for (const template of templates) {
      templateMap[template.name] = template;
      templateMap[template.reference] = template;
    }

    return templateMap;
  }
}
