import { Injectable, HttpStatus } from '@nestjs/common';
import { SessionRepository } from '../../../repositories/session.repository';
import { BlacklistRepository } from '../../../repositories/blacklist.repository';
import { AdminSecurityValidator } from './security.validator';
import { Constants } from '../../../common/enums/generic.enum';
import { generateSuccessResponse, transformToPaginationMeta } from '../../../utils/util';
import { handleServiceError } from '../../../utils/error.util';
import { config } from '../../../config/config';
import {
  GetSecurityActivityDto,
  GetBlacklistStatsDto,
  GetBlacklistEntriesDto,
  CreateBlacklistEntryDto,
  UpdateBlacklistEntryDto,
  GetRateLimitStatsDto,
  ClearUserRateLimitsDto,
  ClearBlacklistEntryDto,
  SecurityActivityListResponse,
  BlacklistStatsResponse,
  RateLimitStatsResponse,
} from './dto/security.dto';

@Injectable()
export class AdminSecurityService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly blacklistRepository: BlacklistRepository,
    private readonly adminSecurityValidator: AdminSecurityValidator,
  ) {}

  // Blacklist CRUD Operations
  async getBlacklistEntries(filter: GetBlacklistEntriesDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedFilter = await this.adminSecurityValidator.validateGetBlacklistEntries(filter);
      
      const result = await this.blacklistRepository.findAll({
        offset: validatedFilter.offset || 0,
        limit: validatedFilter.limit || config.validation.pagination.defaultLimit,
        type: validatedFilter.type,
        keyword: validatedFilter.keyword,
      });
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          data: result.data,
          meta: transformToPaginationMeta({ limit: result.limit, offset: result.offset, total: result.total }),
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving blacklist entries', error);
    }
  }

  async createBlacklistEntry(createDto: CreateBlacklistEntryDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedData = await this.adminSecurityValidator.validateCreateBlacklistEntry(createDto);
      
      const blacklistEntry = await this.blacklistRepository.create(validatedData);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: blacklistEntry,
      });
    } catch (error) {
      return handleServiceError('Error creating blacklist entry', error);
    }
  }

  async getBlacklistEntry(id: number): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminSecurityValidator.validateBlacklistEntryExists(id);
      const blacklistEntry = await this.blacklistRepository.findById(validatedId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: blacklistEntry,
      });
    } catch (error) {
      return handleServiceError('Error retrieving blacklist entry', error);
    }
  }

  async updateBlacklistEntry(id: number, updateDto: UpdateBlacklistEntryDto): Promise<{ status: number; message: string; data: any }> {
    try {
      const validatedId = await this.adminSecurityValidator.validateBlacklistEntryExists(id);
      const validatedData = await this.adminSecurityValidator.validateUpdateBlacklistEntry(updateDto);
      
      const blacklistEntry = await this.blacklistRepository.update(validatedId, validatedData);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: blacklistEntry,
      });
    } catch (error) {
      return handleServiceError('Error updating blacklist entry', error);
    }
  }

  async deleteBlacklistEntry(id: number): Promise<{ status: number; message: string }> {
    try {
      const validatedId = await this.adminSecurityValidator.validateBlacklistEntryExists(id);
      await this.blacklistRepository.delete(validatedId);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
      });
    } catch (error) {
      return handleServiceError('Error deleting blacklist entry', error);
    }
  }

  async getSecurityActivity(filter: GetSecurityActivityDto): Promise<{ status: number; message: string; data: SecurityActivityListResponse }> {
    try {
      const validatedFilter = await this.adminSecurityValidator.validateGetSecurityActivity(filter);
      
      // TODO: Implement security activity retrieval from session repository
      // For now, return placeholder data
      const securityActivity = await this.sessionRepository.getSessionsByUserId(validatedFilter.userId!);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: {
          data: securityActivity || [],
          meta: {
            total: 0,
            page: config.validation.pagination.defaultPage,
            limit: validatedFilter.limit || config.validation.pagination.defaultLimit,
            totalPages: 0,
          },
        },
      });
    } catch (error) {
      return handleServiceError('Error retrieving security activity', error);
    }
  }

  async getBlacklistStats(filter: GetBlacklistStatsDto): Promise<{ status: number; message: string; data: BlacklistStatsResponse }> {
    try {
      await this.adminSecurityValidator.validateGetBlacklistStats(filter);
      
      // TODO: Implement blacklist statistics
      // For now, return placeholder data
      const stats: BlacklistStatsResponse = {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        permanentEntries: 0,
        temporaryEntries: 0,
        entriesByType: {
          ip: 0,
          email: 0,
          phone: 0,
          user: 0,
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: stats,
      });
    } catch (error) {
      return handleServiceError('Error retrieving blacklist statistics', error);
    }
  }

  async getRateLimitStats(filter: GetRateLimitStatsDto): Promise<{ status: number; message: string; data: RateLimitStatsResponse }> {
    try {
      await this.adminSecurityValidator.validateGetRateLimitStats(filter);
      
      // TODO: Implement rate limit statistics
      // For now, return placeholder data
      const stats: RateLimitStatsResponse = {
        totalRateLimits: 0,
        activeRateLimits: 0,
        expiredRateLimits: 0,
        rateLimitsByType: {
          login: 0,
          mfa: 0,
          otp: 0,
          passwordReset: 0,
        },
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: stats,
      });
    } catch (error) {
      return handleServiceError('Error retrieving rate limit statistics', error);
    }
  }

  async clearUserRateLimits(clearDto: ClearUserRateLimitsDto): Promise<{ status: number; message: string }> {
    try {
      await this.adminSecurityValidator.validateClearUserRateLimits(clearDto);
      
      // TODO: Implement rate limit clearing
      // await this.mfaRepository.clearUserRateLimits(_validatedData.userId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error clearing user rate limits', error);
    }
  }

  async clearBlacklistEntry(clearDto: ClearBlacklistEntryDto): Promise<{ status: number; message: string }> {
    try {
      await this.adminSecurityValidator.validateClearBlacklistEntry(clearDto);
      
      // TODO: Implement blacklist entry clearing
      // await this.blacklistRepository.delete(_validatedData.id);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
      });
    } catch (error) {
      return handleServiceError('Error clearing blacklist entry', error);
    }
  }
} 