// LoginActivity entity - based on Session model
export class LoginActivityEntity {
  id: number;
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
  location?: string | null;
  success: boolean;
  createdAt: Date;

  constructor(data: {
    id: number;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    location?: string | null;
    success: boolean;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.location = data.location;
    this.success = data.success;
    this.createdAt = data.createdAt;
  }

  static createEntity(data: {
    id: number;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    location?: string | null;
    success: boolean;
    createdAt: Date;
  }): LoginActivityEntity {
    return new LoginActivityEntity(data);
  }

  static createEntities(data: Array<{
    id: number;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    location?: string | null;
    success: boolean;
    createdAt: Date;
  }>): LoginActivityEntity[] {
    return data.map(item => LoginActivityEntity.createEntity(item));
  }
} 