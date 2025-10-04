// Recovery DTOs
export class RecoveryInitiateDto {
  email: string;
  reason: 'lost_all_2fa_methods';
}

export class RecoveryInitiateResponseDto {
  success: boolean;
  recovery_id: string;
  message: string;
  estimated_review_time: string;
}

export class RecoveryVerifyDto {
  recovery_token: string;
  new_password: string;
  security_answers?: {
    question_1?: string;
    question_2?: string;
  };
} 