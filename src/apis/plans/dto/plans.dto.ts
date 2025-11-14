import { PlanType } from '@prisma/client';

export class GetPlansQueryDto {
  planType?: PlanType | string;
  name?: string;
}
