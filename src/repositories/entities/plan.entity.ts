import { PlanType } from "@prisma/client";

export class PlanListFilters {
    planType?: PlanType;
    name?: string;
}