import { Injectable, HttpStatus } from '@nestjs/common';
import * as Joi from 'joi';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { GetLogsDto } from './dto/logs.dto';
import { ApiRequestLogRepository } from '../../repositories/api-request-log.repository';

@Injectable()
export class LogsValidator {
  constructor(private readonly apiRequestLogRepository: ApiRequestLogRepository) { }

  async validateGetLogsRequest(query: GetLogsDto): Promise<GetLogsDto> {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional().messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
      limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100',
      }),
      statusCode: Joi.number().integer().min(100).max(599).optional().messages({
        'number.base': 'Status code must be a number',
        'number.integer': 'Status code must be an integer',
        'number.min': 'Status code must be at least 100',
        'number.max': 'Status code must not exceed 599',
      }),
      httpMethod: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional().messages({
        'any.only': 'HTTP method must be one of: GET, POST, PUT, DELETE, PATCH',
      }),
      endpoint: Joi.string().max(500).optional().messages({
        'string.max': 'Endpoint must not exceed 500 characters',
      }),
      startDate: Joi.date().iso().optional().messages({
        'date.format': 'Start date must be a valid ISO date',
      }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
        'date.format': 'End date must be a valid ISO date',
        'date.min': 'End date must be after start date',
      }),
      apiKeyId: Joi.number().integer().min(1).optional().messages({
        'number.base': 'API key ID must be a number',
        'number.integer': 'API key ID must be an integer',
        'number.min': 'API key ID must be at least 1',
      }),
    });

    console.log('validateGetLogsRequest');

    const error = validateJoiSchema(schema, query);
    if (error) throwError(error, HttpStatus.BAD_REQUEST, 'validationError');

    return query;
  }

  async validateGetLogDetailsRequest(id: string, teamId: number): Promise<{ logId: string; log: any }> {
    const idSchema = Joi.object({
      id: Joi.string().required().min(1).messages({
        'string.min': 'Log ID must not be empty',
        'any.required': 'Log ID is required',
      }),
    });

    const idError = validateJoiSchema(idSchema, { id });
    if (idError) throwError(idError, HttpStatus.BAD_REQUEST, 'validationError');

    // 2. Validate log exists and belongs to team
    const log = await this.apiRequestLogRepository.findById(id);
    if (!log) {
      throwError('Log not found', HttpStatus.NOT_FOUND, 'logNotFound');
    }

    if (log.teamId !== teamId) {
      throwError('Log does not belong to this team', HttpStatus.FORBIDDEN, 'logAccessDenied');
    }

    return { logId: id, log };
  }
}
