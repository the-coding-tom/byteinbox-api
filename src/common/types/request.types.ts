import { Request } from 'express';

/**
 * Extended request with injected auth data
 */
export interface AuthenticatedRequest extends Request {
  userId?: number; // Only present after authentication
  teamId?: number; // Only present after authentication  
  apiKeyId?: number; // Only present for API key requests
  authType?: 'jwt' | 'api_key'; // Only present after authentication
  
  // Injected by scope middlewares
  user?: {
    id: number;
    email: string;
    name: string;
    status: string;
    photoUrl?: string;
    localAuthAccount?: any;
    [key: string]: any;
  };
  team?: {
    id: number;
    reference: string;
    name: string;
    slug: string;
    [key: string]: any;
  };
}
