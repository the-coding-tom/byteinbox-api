import { Injectable, HttpStatus } from '@nestjs/common';
import { generateSuccessResponse, transformToPaginationMeta } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { GetLogsDto } from './dto/logs.dto';
import { LogsValidator } from './logs.validator';
import { ApiRequestLogRepository } from '../../repositories/api-request-log.repository';

@Injectable()
export class LogsService {
  constructor(
    private readonly apiRequestLogRepository: ApiRequestLogRepository,
    private readonly logsValidator: LogsValidator,
  ) { }

  async getLogs(query: GetLogsDto, teamId: number) {
    try {
      // Validate request
      const validatedData = await this.logsValidator.validateGetLogsRequest(query);

      // Set pagination parameters
      const page = validatedData.page || config.validation.pagination.defaultPage;
      const limit = validatedData.limit || config.validation.pagination.defaultLimit;

      // Get logs with pagination
      const result = await this.apiRequestLogRepository.findByTeamIdWithPagination({
        teamId,
        statusCode: validatedData.statusCode,
        httpMethod: validatedData.httpMethod,
        endpoint: validatedData.endpoint,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        apiKeyId: validatedData.apiKeyId,
        offset: (page - 1) * limit,
        limit: limit
      });

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: result.data,
        meta: transformToPaginationMeta({
          total: result.total,
          offset: result.offset,
          limit: result.limit
        })
      });
    } catch (error) {
      return handleServiceError('Error retrieving logs', error);
    }
  }

  async getLogDetails(id: string, teamId: number) {
    try {
      // Validate request
      const { logId } = await this.logsValidator.validateGetLogDetailsRequest(id, teamId);

      // Get detailed log information
      const detailedLog = await this.apiRequestLogRepository.findByIdWithRelations(logId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data: detailedLog
      });
    } catch (error) {
      return handleServiceError('Error retrieving log details', error);
    }
  }
}
