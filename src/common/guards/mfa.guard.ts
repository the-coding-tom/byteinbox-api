import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRE_MFA_KEY } from '../decorators/auth.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireMfa = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMfa) {
      return true; // MFA not required for this route
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.mfaEnabled) {
      throw new UnauthorizedException(
        'MFA is required for this operation. Please enable MFA first.',
      );
    }

    // Check if MFA was verified in this session
    // This could be implemented by checking a flag in the JWT token or session
    const mfaVerified = user.mfaVerified || false;

    if (!mfaVerified) {
      throw new UnauthorizedException('MFA verification required for this operation');
    }

    return true;
  }
}
