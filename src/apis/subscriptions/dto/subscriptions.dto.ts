export class CreateCheckoutSessionDto {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class ChangePlanDto {
  newPriceId: string;
}
