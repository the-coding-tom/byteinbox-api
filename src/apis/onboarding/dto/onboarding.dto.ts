export class GetLanguagesResponseDto {
  languages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export class GetStepsResponseDto {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    order: number;
  }>;
}

export class GenerateApiKeyDto {
  name: string;
  permission: string;
  domain?: string;
}

export class GenerateApiKeyResponseDto {
  apiKey: {
    id: string;
    name: string;
    key: string;
    permission: string;
    domain?: string;
    createdAt: string;
  };
}

export class UpdateStepDto {
  stepId: string;
  completed: boolean;
}

export class UpdateStepResponseDto {
  step: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    order: number;
  };
}

export class SendTestEmailDto {
  to: string;
  subject: string;
  content: string;
}

export class SendTestEmailResponseDto {
  message: string;
  emailId: string;
}
