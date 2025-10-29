import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateContactDto, UpdateContactDto, AudienceFilterDto, CreateAudienceDto } from './dto/audiences.dto';
import { validateJoiSchema } from '../../utils/joi.validator';
import { throwError } from '../../utils/util';
import { AudienceRepository } from '../../repositories/audience.repository';
import { ContactRepository } from '../../repositories/contact.repository';
import { AudienceData } from '../../repositories/entities/audience.entity';
import { ContactListData } from '../../repositories/entities/contact.entity';
import { ContactStatus } from '@prisma/client';
import * as Joi from 'joi';

@Injectable()
export class AudiencesValidator {
  constructor(
    private readonly audienceRepository: AudienceRepository,
    private readonly contactRepository: ContactRepository,
  ) {}

  async validateGetAudience(teamId: number, audienceId: string): Promise<{ validatedData: { teamId: number; audienceId: string; audience: AudienceData } }> {
    const schema = Joi.object({
      audienceId: Joi.string().min(1).required(),
      teamId: Joi.number().integer().positive().required(),
    });

    const validationError = validateJoiSchema(schema, { audienceId, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, audienceId, audience: audience! } };
  }

  async validateCreateAudience(teamId: number, userId: number, dto: CreateAudienceDto): Promise<{ validatedData: { teamId: number; userId: number; name: string } }> {
    const schema = Joi.object({
      name: Joi.string().min(1).max(255).required(),
    });

    const validationError = validateJoiSchema(schema, dto);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate userId
    if (!userId || userId <= 0) {
      throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: { teamId, userId, name: dto.name } };
  }

  async validateCreateContact(
    teamId: number,
    userId: number,
    audienceId: string,
    dto: CreateContactDto,
  ): Promise<{ validatedData: { teamId: number; userId: number; audienceId: string; audience: AudienceData; dto: CreateContactDto } }> {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      unsubscribed: Joi.boolean().optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      metadata: Joi.object().optional(),
    });

    const validationError = validateJoiSchema(schema, dto);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate userId
    if (!userId || userId <= 0) {
      throwError('Invalid user ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, userId, audienceId, audience: audience!, dto } };
  }

  async validateGetAudiences(teamId: number, filter: AudienceFilterDto): Promise<{ validatedData: { teamId: number; filter: AudienceFilterDto } }> {
    const schema = Joi.object({
      page: Joi.number().min(1).optional(),
      limit: Joi.number().min(1).max(100).optional(),
      type: Joi.string().optional(),
      search: Joi.string().optional(),
    });

    const validationError = validateJoiSchema(schema, filter);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    return { validatedData: { teamId, filter } };
  }

  async validateGetAudienceContacts(teamId: number, audienceId: string): Promise<{ validatedData: { teamId: number; audienceId: string; audience: AudienceData } }> {
    const schema = Joi.object({
      audienceId: Joi.string().min(1).required(),
      teamId: Joi.number().integer().positive().required(),
    });

    const validationError = validateJoiSchema(schema, { audienceId, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, audienceId, audience: audience! } };
  }

  async validateGetContact(teamId: number, audienceId: string, contactId: string): Promise<{ validatedData: { teamId: number; audienceId: string; contactId: string; audience: AudienceData; contact: ContactListData } }> {
    const schema = Joi.object({
      audienceId: Joi.string().min(1).required(),
      contactId: Joi.string().min(1).required(),
      teamId: Joi.number().integer().positive().required(),
    });

    const validationError = validateJoiSchema(schema, { audienceId, contactId, teamId });
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // Fetch and validate contact exists
    const contact = await this.contactRepository.findByReference(contactId, audience!.id as number, teamId);
    if (!contact) {
      throwError('Contact not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, audienceId, contactId, audience: audience!, contact: contact! } };
  }


  async validateUpdateContact(
    teamId: number,
    audienceId: string,
    contactIdentifier: string,
    dto: UpdateContactDto,
  ): Promise<{ validatedData: { teamId: number; audienceId: string; contactIdentifier: string; audience: AudienceData; contact: ContactListData; dto: UpdateContactDto; status: ContactStatus | undefined } }> {
    const schema = Joi.object({
      unsubscribed: Joi.boolean().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      metadata: Joi.object().optional(),
    });

    const validationError = validateJoiSchema(schema, dto);
    if (validationError) {
      throwError(validationError, HttpStatus.BAD_REQUEST, 'validationError');
    }

    // At least one field should be provided for update
    if (dto.unsubscribed === undefined && !dto.firstName && !dto.lastName && !dto.tags && !dto.metadata) {
      throwError('At least one field is required for update', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // Fetch and validate contact exists (by reference or email)
    const contact = await this.contactRepository.findByReferenceOrEmail(contactIdentifier, audience!.id as number, teamId);
    if (!contact) {
      throwError('Contact not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // 
    const status = dto.unsubscribed !== undefined
      ? (dto.unsubscribed ? ContactStatus.unsubscribed : ContactStatus.subscribed)
      : undefined;

    return { validatedData: { teamId, audienceId, contactIdentifier, audience: audience!, contact: contact!, dto, status } };
  }

  async validateDeleteContact(
    teamId: number,
    audienceId: string,
    contactIdentifier: string,
  ): Promise<{ validatedData: { teamId: number; audienceId: string; contactIdentifier: string; audience: AudienceData; contact: ContactListData } }> {
    // Validate teamId
    if (!teamId || teamId <= 0) {
      throwError('Invalid team ID', HttpStatus.BAD_REQUEST, 'validationError');
    }

    // Fetch and validate audience exists
    const audience = await this.audienceRepository.findByReference(audienceId, teamId);
    if (!audience) {
      throwError('Audience not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    // Fetch and validate contact exists (by reference or email)
    const contact = await this.contactRepository.findByReferenceOrEmail(contactIdentifier, audience!.id as number, teamId);
    if (!contact) {
      throwError('Contact not found', HttpStatus.NOT_FOUND, 'notFound');
    }

    return { validatedData: { teamId, audienceId, contactIdentifier, audience: audience!, contact: contact! } };
  }
}
