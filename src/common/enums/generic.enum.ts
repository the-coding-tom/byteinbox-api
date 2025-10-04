export enum TransactionStatus {
  pending = 'pending',
  complete = 'complete',
  failed = 'failed',
  cancelled = 'cancelled',
}

export enum UserType {
  customer = 'customer',
  merchant = 'merchant',
  admin = 'admin',
}

export enum TransactionType {
  cashIn = 'cash_in',
  cashOut = 'cash_out',
  transfer = 'transfer',
  payment = 'payment',
}

export enum UserStatus {
  active = 'active',
  inactive = 'inactive',
  pending = 'pending',
  suspended = 'suspended',
}

export const Constants = {
  successMessage: 'Success',
  errorMessage: 'An error occurred',
  unauthorizedMessage: 'Unauthorized access',
  notFoundMessage: 'Resource not found',
  validationErrorMessage: 'Validation failed',
  internalServerErrorMessage: 'Internal server error',
};
