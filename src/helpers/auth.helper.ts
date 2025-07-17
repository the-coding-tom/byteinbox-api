import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  JWT_ACCESS_TOKEN_EXPIRY_FORMAT,
  JWT_REFRESH_TOKEN_EXPIRY_DAYS,
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
  EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
  MILLISECONDS_IN_MINUTE,
  MILLISECONDS_IN_HOUR,
  MILLISECONDS_IN_DAY,
  AUTH_OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  TOKEN_LENGTH,
  REFRESH_TOKEN_LENGTH,
} from '../common/constants/time.constant';
import { RefreshTokenEntity } from '../repositories/entities/refresh-token.entity';
import { UserEntity } from '../repositories/entities/user.entity';
import { logError } from '../utils/logger';
import { generateErrorResponse, throwError } from '../utils/util';

import { AuthenticationHelper } from './authentication';
import { MfaHelper } from './mfa.helper';
import { OAuthUserInfo } from './oauth.helper';
import { createRefreshToken } from './refresh-token.helper';
import {
  createLocalUser,
  createOAuthUser,
  updateVerification,
  updateOAuth,
  updateOtp,
  updateLoginTime,
} from './user.helper';

export async function createUserWithVerification(
  userData: any,
  authHelper: AuthenticationHelper,
  authRepository: any,
): Promise<UserEntity> {
  const hashedPassword = await authHelper.hashPassword(userData.password);
  const emailVerificationToken = authHelper.generateRandomString(TOKEN_LENGTH);
  const emailVerificationExpiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * MILLISECONDS_IN_HOUR,
  );

  const userEntity = createLocalUser({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber,
    isEmailVerified: false,
  });

  const user = await authRepository.createUser(userEntity);
  const updatedUser = updateVerification(user, {
    emailVerificationToken,
    emailVerificationExpiresAt,
  });

  return await authRepository.updateUser(updatedUser);
}

export async function validateUserCredentials(
  email: string,
  password: string,
  authRepository: any,
  authHelper: AuthenticationHelper,
): Promise<UserEntity> {
  const user = await authRepository.findUserByEmail(email);
  if (!user?.password) {
    throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
  }

  const isPasswordValid = await authHelper.validatePassword(password, user.password);
  if (!isPasswordValid) {
    throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
  }

  return user;
}

export function checkUserLoginEligibility(user: UserEntity): void {
  if (!user.isEmailVerified) {
    throwError(
      'Please verify your email before logging in',
      HttpStatus.UNAUTHORIZED,
      'emailNotVerified',
    );
  }

  if (!user.isActive) {
    throwError('Account is deactivated', HttpStatus.UNAUTHORIZED, 'accountDeactivated');
  }
}

export function createMfaRequiredResponse(): any {
  return {
    status: HttpStatus.OK,
    message: 'MFA code required',
    data: { requiresMfa: true },
  };
}

export async function verifyOAuthCredentials(
  oauthData: any,
  OAuthHelper: any,
): Promise<{ oauthUserInfo: OAuthUserInfo; accessToken: string }> {
  if (!oauthData.code) {
    throwError('Authorization code is required', HttpStatus.BAD_REQUEST, 'oauthCodeRequired');
  }

  try {
    const accessToken = await OAuthHelper.exchangeCodeForToken(oauthData.provider, oauthData.code);
    const oauthUserInfo = await OAuthHelper.verifyOAuthToken(oauthData.provider, accessToken);
    return { oauthUserInfo, accessToken };
  } catch (error) {
    throwError(
      `OAuth verification failed: ${error.message}`,
      HttpStatus.UNAUTHORIZED,
      'oauthVerificationFailed',
    );
  }
  throwError('OAuth verification failed', HttpStatus.UNAUTHORIZED, 'oauthVerificationFailed'); // fallback
  return undefined as any;
}

export async function findOrCreateOAuthUser(
  provider: string,
  oauthUserInfo: OAuthUserInfo,
  accessToken: string,
  authRepository: any,
): Promise<UserEntity> {
  let user = await authRepository.findUserByOAuth(provider, oauthUserInfo.id);

  if (!user) {
    user = await authRepository.findUserByEmail(oauthUserInfo.email);

    if (user) {
      // Link existing user to OAuth
      const updatedUser = updateOAuth(user, { oauthProvider: provider, oauthId: oauthUserInfo.id });
      await authRepository.updateUser(updatedUser);
      return updatedUser;
    } else {
      // Create new OAuth user
      const userEntity = createOAuthUser({
        email: oauthUserInfo.email,
        firstName: oauthUserInfo.firstName,
        lastName: oauthUserInfo.lastName,
        oauthProvider: provider,
        oauthId: oauthUserInfo.id,
        isEmailVerified: true,
      });
      return await authRepository.createUser(userEntity);
    }
  }

  return user;
}

export async function generateEmailVerificationToken(
  user: UserEntity,
  authHelper: AuthenticationHelper,
  authRepository: any,
): Promise<UserEntity> {
  const emailVerificationToken = authHelper.generateRandomString(TOKEN_LENGTH);
  const emailVerificationExpiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * MILLISECONDS_IN_HOUR,
  );

  const updatedUser = updateVerification(user, {
    emailVerificationToken,
    emailVerificationExpiresAt,
  });

  return await authRepository.updateUser(updatedUser);
}

export async function generatePasswordResetToken(
  user: UserEntity,
  authHelper: AuthenticationHelper,
  authRepository: any,
): Promise<UserEntity> {
  const passwordResetToken = authHelper.generateRandomString(TOKEN_LENGTH);
  const passwordResetExpiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * MILLISECONDS_IN_MINUTE,
  );

  const updatedUser = updateVerification(user, {
    passwordResetToken,
    passwordResetExpiresAt,
  });

  return await authRepository.updateUser(updatedUser);
}

export async function validatePasswordChange(
  user: UserEntity,
  currentPassword: string,
  authHelper: AuthenticationHelper,
): Promise<void> {
  if (!user.password) {
    throwError(
      'Cannot change password for OAuth users',
      HttpStatus.BAD_REQUEST,
      'oauthUserPasswordChange',
    );
  }

  if (user.password == null) {
    throwError('Password is missing', HttpStatus.BAD_REQUEST, 'missingPassword');
  }

  const isCurrentPasswordValid = await authHelper.validatePassword(
    currentPassword,
    user.password as string,
  );
  if (!isCurrentPasswordValid) {
    throwError('Current password is incorrect', HttpStatus.BAD_REQUEST, 'incorrectCurrentPassword');
  }
}

export async function generateAndSendOtp(
  user: UserEntity,
  method: string,
  authHelper: AuthenticationHelper,
  authRepository: any,
): Promise<string> {
  const otp = authHelper.generateRandomString(OTP_LENGTH);
  const otpExpiresAt = new Date(Date.now() + AUTH_OTP_EXPIRY_MINUTES * MILLISECONDS_IN_MINUTE);

  let updatedUser: UserEntity;
  if (method === 'email') {
    updatedUser = updateOtp(user, { emailOtp: otp, emailOtpExpiresAt: otpExpiresAt });
  } else if (method === 'sms') {
    updatedUser = updateOtp(user, { smsOtp: otp, smsOtpExpiresAt: otpExpiresAt });
  } else {
    throw new Error(`Unsupported OTP method: ${method}`);
  }

  await authRepository.updateUser(updatedUser);
  return otp;
}

export async function getUserByIdOrFail(userId: number, authRepository: any): Promise<UserEntity> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
  }
  return user;
}

export async function updateUserLoginTime(user: UserEntity, authRepository: any): Promise<void> {
  const updatedUser = updateLoginTime(user);
  await authRepository.updateUser(updatedUser);
}

export async function queueNotification(
  type: string,
  data: any,
  notificationQueue: any,
): Promise<void> {
  await notificationQueue.add(type, data);
}

export function handleServiceError(context: string, error: any): any {
  const errorMessage = `${context} ==> ${error}`;
  logError(errorMessage);
  return generateErrorResponse(error);
}

export async function generateTokens(
  user: UserEntity,
  jwtService: JwtService,
  authHelper: AuthenticationHelper,
  authRepository: any,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      mfaEnabled: user.mfaEnabled,
    },
    {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRY_FORMAT,
    },
  );

  const refreshToken = authHelper.generateRandomString(REFRESH_TOKEN_LENGTH);
  const refreshTokenExpiresAt = new Date(
    Date.now() + JWT_REFRESH_TOKEN_EXPIRY_DAYS * MILLISECONDS_IN_DAY,
  );

  const refreshTokenEntity = createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: refreshTokenExpiresAt,
  });

  await authRepository.createRefreshToken(refreshTokenEntity);

  return { accessToken, refreshToken };
}

export async function verifyMfaForLogin(user: UserEntity, code: string): Promise<boolean> {
  if (!user.mfaEnabled || !user.totpSecret) {
    return false;
  }

  return MfaHelper.verifyTotpCode(user.totpSecret, code);
}

export async function verifyMfaCode(
  user: UserEntity,
  code: string,
  method: string,
  authRepository: any,
): Promise<boolean> {
  switch (method) {
    case 'email':
      return await verifyEmailOtpCode(user, code, authRepository);
    case 'sms':
      return await verifySmsOtpCode(user, code, authRepository);
    case 'totp':
      return MfaHelper.verifyTotpCode(user.totpSecret!, code);
    default:
      return false;
  }
}

export async function verifyEmailOtpCode(
  user: UserEntity,
  code: string,
  authRepository: any,
): Promise<boolean> {
  const userWithOtp = await authRepository.findUserByEmailOtp(user.email, code);
  return !!userWithOtp;
}

export async function verifySmsOtpCode(
  user: UserEntity,
  code: string,
  authRepository: any,
): Promise<boolean> {
  if (!user.phoneNumber) {
    return false;
  }
  const userWithOtp = await authRepository.findUserBySmsOtp(user.phoneNumber, code);
  return !!userWithOtp;
}
