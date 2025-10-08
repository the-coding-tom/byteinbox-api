import { Injectable, HttpStatus } from '@nestjs/common';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { CreateContactDto, UpdateContactDto } from './dto/contacts.dto';
import * as Joi from 'joi';

@Injectable()
export class ContactsValidator {
  async validateCreateContact(data: CreateContactDto): Promise<{ validatedData: CreateContactDto }> {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'any.required': 'Email is required',
      }),
      firstName: Joi.string().max(100).optional().messages({
        'string.max': 'First name must not exceed 100 characters',
      }),
      lastName: Joi.string().max(100).optional().messages({
        'string.max': 'Last name must not exceed 100 characters',
      }),
      tags: Joi.array().items(Joi.string()).optional(),
      metadata: Joi.object().optional(),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }

  async validateUpdateContact(data: UpdateContactDto): Promise<{ validatedData: UpdateContactDto }> {
    const schema = Joi.object({
      firstName: Joi.string().max(100).optional().messages({
        'string.max': 'First name must not exceed 100 characters',
      }),
      lastName: Joi.string().max(100).optional().messages({
        'string.max': 'Last name must not exceed 100 characters',
      }),
      tags: Joi.array().items(Joi.string()).optional(),
      metadata: Joi.object().optional(),
    });

    const validationError = validateJoiSchema(schema, data);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: data };
  }
}
