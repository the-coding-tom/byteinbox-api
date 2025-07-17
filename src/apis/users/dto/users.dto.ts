export class CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class UpdateUserDto {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export class UserFilterDto {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
