import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { MfaVerificationSessionRepository } from '../../repositories/mfa-verification-session.repository';
import { BackupCodeRepository } from '../../repositories/backup-code.repository';
import { VerificationRequestRepository } from '../../repositories/verification-request.repository';
import { verifyTotpCode, hashBackupCode } from '../../helpers/mfa.helper';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { validatePassword } from '../../utils/authentication.util';
import { LoginDto, OAuthCallbackDto, LogoutDto, RefreshTokenDto, ResetPasswordRequestDto, ResetPasswordConfirmDto, ChangePasswordDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, MfaVerifyDto, MfaChallengeDto, MfaBackupCodeConsumeDto, MfaDisableDto, MfaRegenerateBackupCodesDto } from './dto/auth.dto';
import { UserEntity } from '../../repositories/entities/user.entity';
import * as Joi from 'joi';

@Injectable()
export class AuthValidator {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly mfaVerificationSessionRepository: MfaVerificationSessionRepository,
        private readonly backupCodeRepository: BackupCodeRepository,
        private readonly verificationRequestRepository: VerificationRequestRepository,
    ) { }

    async validateLogin(data: LoginDto): Promise<{ validatedData: LoginDto; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required',
                }),
            password: Joi.string().required().messages({
                'any.required': 'Password is required',
            }),
        });

        const error = validateJoiSchema(schema, data);
        if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
        }

        // Check email verification first
        if (!user.emailVerifiedAt) {
            throwError('Please verify your email before logging in', HttpStatus.UNAUTHORIZED, 'emailNotVerified');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throwError('Account is not active', HttpStatus.UNAUTHORIZED, 'accountInactive');
        }

        // Validate password
        if (!user.localAuthAccount) {
            throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
        }
        
        const isPasswordValid = await validatePassword(data.password, user.localAuthAccount.passwordHash);
        if (!isPasswordValid) {
            throwError('Invalid email or password', HttpStatus.UNAUTHORIZED, 'invalidCredentials');
        }

        return { validatedData: data, user };
    }

    async validateOAuthCallback(data: OAuthCallbackDto): Promise<OAuthCallbackDto> {
        // Validate input schema
        const schema = Joi.object({
            code: Joi.string().optional(),
            state: Joi.string().optional(),
            scope: Joi.string().optional(),
            authuser: Joi.string().optional(),
            prompt: Joi.string().optional(),
            error: Joi.string().optional(),
            error_description: Joi.string().optional(),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Check for OAuth errors
        if (data.error) {
            throwError(
                `OAuth error: ${data.error_description || data.error}`,
                HttpStatus.BAD_REQUEST,
                'oauthError'
            );
        }

        // Check for required code
        if (!data.code) {
            throwError('Authorization code is required', HttpStatus.BAD_REQUEST, 'missingCode');
        }

        return data;
    }

    async validateLogout(data: LogoutDto): Promise<{ validatedData: LogoutDto; session: any }> {
        // Validate input schema
        const schema = Joi.object({
            refreshToken: Joi.string().required(),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find and validate the session
        const session = await this.sessionRepository.findSessionByRefreshToken(data.refreshToken);
        if (!session) {
            throwError('Invalid refresh token', HttpStatus.UNAUTHORIZED, 'invalidRefreshToken');
        }

        return { validatedData: data, session };
    }

    async validateRefreshToken(data: RefreshTokenDto): Promise<{ validatedData: RefreshTokenDto; session: any; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            refreshToken: Joi.string().required(),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find the session by refresh token
        const session = await this.sessionRepository.findSessionByRefreshToken(data.refreshToken);
        if (!session) {
            throwError('Invalid refresh token', HttpStatus.UNAUTHORIZED, 'invalidRefreshToken');
        }

        // Check if session is expired
        if (session.expiresAt < new Date()) {
            throwError('Refresh token has expired', HttpStatus.UNAUTHORIZED, 'expiredRefreshToken');
        }

        // Check if session is revoked
        if (session.isRevoked) {
            throwError('Refresh token has been revoked', HttpStatus.UNAUTHORIZED, 'revokedRefreshToken');
        }

        // Get user from session
        const user = await this.userRepository.findById(session.userId);
        if (!user) {
            throwError('User not found', HttpStatus.UNAUTHORIZED, 'userNotFound');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throwError('User account is not active', HttpStatus.UNAUTHORIZED, 'accountInactive');
        }

        return { validatedData: data, session, user };
    }

    async validateResetPasswordRequest(data: ResetPasswordRequestDto): Promise<{ validatedData: ResetPasswordRequestDto; user: UserEntity | null }> {
        // Validate input schema
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);

        return { validatedData: data, user };
    }

    async validateResetPasswordConfirm(data: ResetPasswordConfirmDto): Promise<{ validatedData: ResetPasswordConfirmDto; verificationRequest: any; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            token: Joi.string().required().messages({
                'any.required': 'Reset token is required',
            }),
            newPassword: Joi.string()
                .min(8)
                .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&]).{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'any.required': 'New password is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find the verification request by reset token
        const verificationRequest = await this.verificationRequestRepository.findByToken(data.token);
        if (!verificationRequest) {
            throwError('Invalid or expired reset token', HttpStatus.UNAUTHORIZED, 'invalidResetToken');
        }

        // Check if verification request is expired
        if (verificationRequest.expiresAt < new Date()) {
            throwError('Reset token has expired', HttpStatus.UNAUTHORIZED, 'expiredResetToken');
        }

        // Check if it's a password reset request
        if (verificationRequest.type !== 'PASSWORD_RESET') {
            throwError('Invalid verification token type', HttpStatus.UNAUTHORIZED, 'invalidTokenType');
        }

        // Get user from verification request
        const user = await this.userRepository.findById(verificationRequest.userId);
        if (!user) {
            throwError('User not found', HttpStatus.UNAUTHORIZED, 'userNotFound');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throwError('User account is not active', HttpStatus.UNAUTHORIZED, 'accountInactive');
        }

        return { validatedData: data, verificationRequest, user };
    }

    async validateChangePassword(data: ChangePasswordDto, userId: number): Promise<{ validatedData: ChangePasswordDto; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            currentPassword: Joi.string().required().messages({
                'any.required': 'Current password is required',
            }),
            newPassword: Joi.string()
                .min(8)
                .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&]).{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'any.required': 'New password is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwError('User not found', HttpStatus.UNAUTHORIZED, 'userNotFound');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throwError('User account is not active', HttpStatus.UNAUTHORIZED, 'accountInactive');
        }

        // Validate current password
        if (!user.localAuthAccount) {
            throwError('No password set for this account', HttpStatus.UNAUTHORIZED, 'noPasswordSet');
        }
        
        const isCurrentPasswordValid = await validatePassword(data.currentPassword, user.localAuthAccount.passwordHash);
        if (!isCurrentPasswordValid) {
            throwError('Current password is incorrect', HttpStatus.UNAUTHORIZED, 'invalidCurrentPassword');
        }

        // Check if new password is different from current password
        const isNewPasswordSame = await validatePassword(data.newPassword, user.localAuthAccount.passwordHash);
        if (isNewPasswordSame) {
            throwError('New password must be different from current password', HttpStatus.BAD_REQUEST, 'samePassword');
        }

        return { validatedData: data, user };
    }

    async validateRegister(data: RegisterDto): Promise<RegisterDto> {
        // Validate input schema
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required',
                }),
            password: Joi.string()
                .min(8)
                .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&]).{8,}$/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
                    'any.required': 'Password is required',
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Name must be at least 2 characters long',
                    'string.max': 'Name must be at most 100 characters long',
                    'any.required': 'Name is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Check if user already exists by email
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throwError('User with this email already exists', HttpStatus.CONFLICT, 'userAlreadyExists');
        }

        return data;
    }

    async validateVerifyEmail(data: VerifyEmailDto): Promise<{ validatedData: VerifyEmailDto; verificationRequest: any; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            token: Joi.string().required().messages({
                'any.required': 'Verification token is required',
            }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find the verification request by token
        const verificationRequest = await this.verificationRequestRepository.findByToken(data.token);
        if (!verificationRequest) {
            throwError('Invalid or expired verification token', HttpStatus.UNAUTHORIZED, 'invalidVerificationToken');
        }

        // Check if verification request is expired
        if (verificationRequest.expiresAt < new Date()) {
            throwError('Verification token has expired', HttpStatus.UNAUTHORIZED, 'expiredVerificationToken');
        }

        // Check if it's an email verification request
        if (verificationRequest.type !== 'EMAIL_VERIFICATION') {
            throwError('Invalid verification token type', HttpStatus.UNAUTHORIZED, 'invalidTokenType');
        }

        // Get user from verification request
        const user = verificationRequest.User;
        if (!user) {
            throwError('User not found', HttpStatus.UNAUTHORIZED, 'userNotFound');
        }

        // Check if email is already verified
        if (user.emailVerifiedAt) {
            throwError('Email is already verified', HttpStatus.BAD_REQUEST, 'emailAlreadyVerified');
        }

        // Check if user is inactive (expected for unverified users)
        if (user.status !== 'INACTIVE') {
            throwError('User account status is invalid for email verification', HttpStatus.BAD_REQUEST, 'invalidAccountStatus');
        }

        return { validatedData: data, verificationRequest, user };
    }

    async validateResendVerification(data: ResendVerificationDto): Promise<{ validatedData: ResendVerificationDto; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Check if email is already verified
        if (user.emailVerifiedAt) {
            throwError('Email is already verified', HttpStatus.BAD_REQUEST, 'emailAlreadyVerified');
        }

        return { validatedData: data, user };
    }

    async validateMfaChallenge(data: MfaChallengeDto): Promise<{ validatedData: MfaChallengeDto; session: any; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            code: Joi.string()
                .length(6)
                .pattern(/^\d{6}$/)
                .required()
                .messages({
                    'string.length': 'TOTP code must be exactly 6 digits',
                    'string.pattern.base': 'TOTP code must contain only digits',
                    'any.required': 'TOTP code is required',
                }),
            sessionToken: Joi.string().required().messages({
                'any.required': 'Session token is required',
            }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get and validate session
        const session = await this.mfaVerificationSessionRepository.findMfaSessionByToken(data.sessionToken);
        if (!session) {
            throwError('Invalid session', HttpStatus.BAD_REQUEST, 'invalidSession');
        }

        // Get and validate user
        const user = await this.userRepository.findById(session.userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Validate TOTP code
        if (!user.totpEnabled) {
            throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
        }
        if (!user.totpSecret) {
            throwError('TOTP secret not found', HttpStatus.BAD_REQUEST, 'totpSecretNotFound');
        }
        const isValidTotp = await verifyTotpCode(user.totpSecret!, data.code);
        if (!isValidTotp) {
            throwError('Invalid TOTP code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
        }

        return { validatedData: data, session, user };
    }

    async validateMfaVerify(userId: number, data: MfaVerifyDto): Promise<{ validatedData: MfaVerifyDto; user: UserEntity }> {
        // Validate input schema
        const schema = Joi.object({
            code: Joi.string()
                .length(6)
                .pattern(/^\d{6}$/)
                .required()
                .messages({
                    'string.length': 'TOTP code must be exactly 6 digits',
                    'string.pattern.base': 'TOTP code must contain only digits',
                    'any.required': 'TOTP code is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get user and validate
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Check if TOTP is already enabled
        if (user.totpEnabled) {
            throwError('TOTP is already enabled', HttpStatus.BAD_REQUEST, 'totpAlreadyEnabled');
        }

        // Validate the verification code
        if (!user.totpSecret) {
            throwError('TOTP setup not found or expired', HttpStatus.BAD_REQUEST, 'totpSetupNotFound');
        }

        const isValid = await verifyTotpCode(user.totpSecret!, data.code);
        if (!isValid) {
            throwError('Invalid verification code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
        }

        return { validatedData: data, user };
    }

    async validateGetBackupCodes(userId: number): Promise<UserEntity> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }
        return user as UserEntity;
    }

    async validateMfaBackupCodeConsume(data: MfaBackupCodeConsumeDto): Promise<{ validatedData: MfaBackupCodeConsumeDto; session: any; user: UserEntity; matchingCode: any }> {
        // Validate input schema
        const schema = Joi.object({
            code: Joi.string()
                .length(8)
                .pattern(/^[A-Z0-9]{8}$/)
                .required()
                .messages({
                    'string.length': 'Backup code must be exactly 8 characters',
                    'string.pattern.base': 'Backup code must contain only uppercase letters and numbers',
                    'any.required': 'Backup code is required',
                }),
            sessionToken: Joi.string().required().messages({
                'any.required': 'Session token is required',
            }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get and validate session
        const session = await this.mfaVerificationSessionRepository.findMfaSessionByToken(data.sessionToken);
        if (!session) {
            throwError('Invalid session', HttpStatus.BAD_REQUEST, 'invalidSession');
        }

        // Get and validate user
        const user = await this.userRepository.findById(session.userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Validate backup code
        const backupCodes = await this.backupCodeRepository.findByUserId(session.userId);
        const hashedCode = await hashBackupCode(data.code);
        const matchingCode = backupCodes.find(code => 
            !code.used && code.code === hashedCode
        );
        if (!matchingCode) {
            throwError('Invalid backup code', HttpStatus.BAD_REQUEST, 'invalidBackupCode');
        }

        return { validatedData: data, session, user, matchingCode };
    }

    async validateMfaDisable(userId: number, data: MfaDisableDto): Promise<{ validatedData: MfaDisableDto; user: UserEntity }> {
        // Validate input data - accept both TOTP (6 digits) and backup code (8 characters)
        const schema = Joi.object({
            code: Joi.string()
                .min(6)
                .max(8)
                .pattern(/^[A-Z0-9]{6,8}$/)
                .required()
                .messages({
                    'string.min': 'Code must be at least 6 characters',
                    'string.max': 'Code must not exceed 8 characters',
                    'string.pattern.base': 'Code must contain only uppercase letters and numbers',
                    'any.required': 'Verification code is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get user and validate
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Verify TOTP is enabled
        if (!user.totpEnabled || !user.totpSecret) {
            throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
        }

        // Determine verification method based on code length
        if (data.code.length === 6) {
            // TOTP code validation
            const isValid = await verifyTotpCode(user.totpSecret!, data.code);
            if (!isValid) {
                throwError('Invalid TOTP code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
            }
        } else if (data.code.length === 8) {
            // Backup code validation
            const backupCodes = await this.backupCodeRepository.findByUserId(userId);
            const hashedCode = await hashBackupCode(data.code);
            const matchingCode = backupCodes.find(code => 
                !code.used && code.code === hashedCode
            );
            if (!matchingCode) {
                throwError('Invalid backup code', HttpStatus.BAD_REQUEST, 'invalidBackupCode');
            }
        }

        return { validatedData: data, user };
    }

    async validateMfaRegenerateBackupCodes(userId: number, data: MfaRegenerateBackupCodesDto): Promise<{ validatedData: MfaRegenerateBackupCodesDto; user: UserEntity }> {
        // Validate input data - only accept TOTP (6 digits)
        const schema = Joi.object({
            code: Joi.string()
                .length(6)
                .pattern(/^[0-9]{6}$/)
                .required()
                .messages({
                    'string.length': 'TOTP code must be exactly 6 digits',
                    'string.pattern.base': 'TOTP code must contain only numbers',
                    'any.required': 'TOTP code is required',
                }),
        });

        const validationError = validateJoiSchema(schema, data);
        if (validationError) {
            throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
        }

        // Get user and validate
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwError('User not found', HttpStatus.NOT_FOUND, 'userNotFound');
        }

        // Verify TOTP is enabled
        if (!user.totpEnabled || !user.totpSecret) {
            throwError('TOTP not enabled', HttpStatus.BAD_REQUEST, 'totpNotEnabled');
        }

        // Validate TOTP code
        const isValid = await verifyTotpCode(user.totpSecret!, data.code);
        if (!isValid) {
            throwError('Invalid TOTP code', HttpStatus.BAD_REQUEST, 'invalidTotpCode');
        }

        return { validatedData: data, user };
    }

}
