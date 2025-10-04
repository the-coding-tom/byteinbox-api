import { LoginActivity } from '@prisma/client';

export class LoginActivityEntity implements LoginActivity {
  id: number;
  userId: number;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  success: boolean;
  createdAt: Date;

  constructor(data: LoginActivity) {
    this.id = data.id;
    this.userId = data.userId;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.location = data.location;
    this.success = data.success;
    this.createdAt = data.createdAt;
  }

  static createEntity(data: LoginActivity): LoginActivityEntity {
    return new LoginActivityEntity(data);
  }

  static createEntities(data: LoginActivity[]): LoginActivityEntity[] {
    return data.map(item => LoginActivityEntity.createEntity(item));
  }
} 