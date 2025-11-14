import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { PlanType } from '@prisma/client';
import {
  PlanRepository,
} from '../../repositories/plan.repository';
import { GetPlansQueryDto } from './dto/plans.dto';
import { PlanListFilters } from '../../repositories/entities/plan.entity';

@Injectable()
export class PlansValidator {
  constructor(private readonly planRepository: PlanRepository) { }

  async validateGetPlansQuery(
    query: GetPlansQueryDto,
  ): Promise<PlanListFilters> {

    const schema = Joi.object({
      planType: Joi.string()
        .valid(...Object.values(PlanType))
        .optional(),
      name: Joi.string().max(100).optional(),
    });

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return query as PlanListFilters;
  }

  async validateGetPlanBySlug(
    slug: string,
  ): Promise<any> {
    const schema = Joi.object({
      slug: Joi.string().min(1).max(100).required().messages({
        'any.required': 'Slug is required',
        'string.empty': 'Slug cannot be empty',
        'string.min': 'Slug must be at least 1 character',
        'string.max': 'Slug must not exceed 100 characters',
      }),
    });

    const error = validateJoiSchema(schema, { slug });
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    const plan = await this.planRepository.findDetailedBySlug(slug);

    if (!plan) {
      throwError('Plan not found', HttpStatus.NOT_FOUND, 'planNotFound');
    }

    return plan;
  }
}
