import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

// Key for metadata to skip auth
export const IS_PUBLIC_KEY = 'isPublic';

// Decorator to mark routes as public (skip authentication)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Decorator to extract current user from request
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// Decorator to extract specific user property
export const UserProperty = createParamDecorator((property: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.[property];
});

// Decorator to extract user ID
export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.id;
});

// Decorator to extract user email
export const UserEmail = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.email;
});

// Decorator for role-based access control
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Decorator for permission-based access control
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Decorator to require MFA for sensitive operations
export const REQUIRE_MFA_KEY = 'requireMfa';
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);

// Decorator to require email verification
export const REQUIRE_EMAIL_VERIFICATION_KEY = 'requireEmailVerification';
export const RequireEmailVerification = () => SetMetadata(REQUIRE_EMAIL_VERIFICATION_KEY, true);
