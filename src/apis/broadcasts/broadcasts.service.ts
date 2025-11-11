import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BroadcastsValidator } from './broadcasts.validator';
import { BroadcastRepository } from '../../repositories/broadcast.repository';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { BROADCAST_PROCESSING_QUEUE } from '../../common/constants/queues.constant';
import {
  CreateBroadcastDto,
  BroadcastFilterDto,
  CreateBroadcastResponseDto,
  UpdateBroadcastDto,
  SendBroadcastDto,
  SendBroadcastResponseDto
} from './dto/broadcasts.dto';

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly broadcastsValidator: BroadcastsValidator,
    private readonly broadcastRepository: BroadcastRepository,
    @InjectQueue(BROADCAST_PROCESSING_QUEUE) private readonly broadcastProcessingQueue: Queue,
  ) {}

  async createBroadcast(userId: number, teamId: number, createBroadcastDto: CreateBroadcastDto): Promise<any> {
    try {
      // Validate input data and audience
      const { validatedData, audienceId } = await this.broadcastsValidator.validateCreateBroadcast(createBroadcastDto, teamId);

      // Create broadcast in database
      const broadcast = await this.broadcastRepository.create({
        teamId,
        createdBy: userId,
        audienceId,
        from: validatedData.from,
        subject: validatedData.subject,
        replyTo: validatedData.replyTo,
        html: validatedData.html,
        text: validatedData.text,
        name: validatedData.name,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      });

      const response: CreateBroadcastResponseDto = {
        id: broadcast.reference,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating broadcast');
    }
  }

  async getBroadcasts(teamId: number, filter: BroadcastFilterDto): Promise<any> {
    try {
      // Set defaults from config
      const page = filter.page || config.validation.pagination.defaultPage;
      const limit = filter.limit || config.validation.pagination.defaultLimit;
      const offset = (page - 1) * limit;

      // Fetch broadcasts from repository
      const { data: broadcasts } = await this.broadcastRepository.findWithFilter(teamId, {
        status: filter.status,
        offset,
        limit,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: broadcasts
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving broadcasts');
    }
  }

  async getBroadcastDetails(broadcastId: string, teamId: number): Promise<any> {
    try {
      // Validate and fetch broadcast
      const { broadcast } = await this.broadcastsValidator.validateGetBroadcastDetails(broadcastId, teamId);

      // Transform the response to use reference as id
      const { id: _internalId, reference, ...rest } = broadcast;
      const response = {
        id: reference,
        ...rest,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving broadcast details');
    }
  }

  async updateBroadcast(broadcastId: string, userId: number, updateBroadcastDto: UpdateBroadcastDto, request: any): Promise<any> {
    try {
      // Validate and fetch broadcast
      const { validatedData, audienceId, broadcast } = await this.broadcastsValidator.validateUpdateBroadcast(
        { ...updateBroadcastDto, broadcastId },
        request.teamId
      );

      // Update broadcast in database - Prisma automatically ignores undefined values
      const { reference } = await this.broadcastRepository.update(broadcast.id, {
        audienceId,
        from: validatedData.from,
        subject: validatedData.subject,
        replyTo: validatedData.replyTo,
        html: validatedData.html,
        text: validatedData.text,
        name: validatedData.name,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: { id: reference },
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating broadcast');
    }
  }

  async deleteBroadcast(broadcastId: string, userId: number, request: any): Promise<any> {
    try {
      // Validate and fetch broadcast
      const { broadcast } = await this.broadcastsValidator.validateDeleteBroadcast(broadcastId, request.teamId);

      // Delete broadcast from database
      await this.broadcastRepository.delete(broadcast.id);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: { id: broadcast.reference },
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting broadcast');
    }
  }

  async sendBroadcast(broadcastId: string, sendBroadcastDto: SendBroadcastDto, request: any): Promise<any> {
    try {
      // Validate and get broadcast
      const { scheduledAt, broadcast } = await this.broadcastsValidator.validateSendBroadcast(
        sendBroadcastDto,
        broadcastId,
        request.teamId
      );

      if (scheduledAt) {
        // If scheduled, update broadcast with scheduled time and status
        await this.broadcastRepository.update(broadcast.id, {
          scheduledAt,
          status: 'scheduled',
        });
      } else {
        // If immediate send, enqueue broadcast for processing
        await this.broadcastProcessingQueue.add(
          {
            broadcastId: broadcast.id,
            teamId: request.teamId,
          },
          {
            removeOnComplete: true,
            attempts: 3,
          }
        );
      }

      const response: SendBroadcastResponseDto = {
        id: broadcast.reference,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: scheduledAt ? 'Broadcast scheduled successfully' : 'Broadcast enqueued for sending',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error sending broadcast');
    }
  }

}
