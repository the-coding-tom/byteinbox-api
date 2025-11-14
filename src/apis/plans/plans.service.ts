import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { PlanRepository } from '../../repositories/plan.repository';
import { PlansValidator } from './plans.validator';
import { GetPlansQueryDto } from './dto/plans.dto';

@Injectable()
export class PlansService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly plansValidator: PlansValidator,
  ) {}

  /**
   * Get all available plans with tiers
   */
  async getAllPlans(query: GetPlansQueryDto): Promise<any> {
    try {
      const filters = await this.plansValidator.validateGetPlansQuery(query);
      const plans = await this.planRepository.findAllDetailed(filters);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: plans,
      });
    } catch (error) {
      return handleServiceError('Error fetching plans', error);
    }
  }

  /**
   * Get plan by slug
   */
  async getPlanBySlug(slug: string): Promise<any> {
    try {
      const plan = await this.plansValidator.validateGetPlanBySlug(slug);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: plan,
      });
    } catch (error) {
      return handleServiceError('Error fetching plan', error);
    }
  }
}
