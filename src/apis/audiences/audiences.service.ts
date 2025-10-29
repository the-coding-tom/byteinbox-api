import { HttpStatus, Injectable } from '@nestjs/common';
import { generateSuccessResponse } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';
import { Constants } from '../../common/enums/generic.enum';
import { config } from '../../config/config';
import { AudiencesValidator } from './audiences.validator';
import { AudienceRepository } from '../../repositories/audience.repository';
import { ContactRepository } from '../../repositories/contact.repository';
import {
  AudienceFilterDto,
  ContactFilterDto,
  CreateContactDto,
  UpdateContactDto,
  CreateContactResponseDto,
  UpdateContactResponseDto,
  DeleteContactResponseDto,
  CreateAudienceDto,
  CreateAudienceResponseDto,
  GetAudienceResponseDto
} from './dto/audiences.dto';

@Injectable()
export class AudiencesService {
  constructor(
    private readonly audiencesValidator: AudiencesValidator,
    private readonly audienceRepository: AudienceRepository,
    private readonly contactRepository: ContactRepository,
  ) {}

  async getAudience(audienceId: string, teamId: number): Promise<any> {
    try {
      // Validate input and fetch audience
      const { validatedData } = await this.audiencesValidator.validateGetAudience(teamId, audienceId);

      const response: GetAudienceResponseDto = {
        id: validatedData.audience.reference!,
        name: validatedData.audience.name,
        createdAt: validatedData.audience.createdAt!,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving audience');
    }
  }

  async deleteAudience(audienceId: string, teamId: number): Promise<any> {
    try {
      // Validate input and fetch audience
      const { validatedData } = await this.audiencesValidator.validateGetAudience(teamId, audienceId);

      // Delete audience from repository
      await this.audienceRepository.delete(validatedData.audienceId, validatedData.teamId);

      const response = {
        id: validatedData.audience.reference!,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting audience');
    }
  }

  async createAudience(userId: number, dto: CreateAudienceDto, teamId: number): Promise<any> {
    try {
      // Validate input
      const { validatedData } = await this.audiencesValidator.validateCreateAudience(teamId, userId, dto);

      // Create audience in repository
      const audience = await this.audienceRepository.create({
        name: validatedData.name,
        teamId: validatedData.teamId,
        createdBy: validatedData.userId,
      });

      const response: CreateAudienceResponseDto = {
        id: audience.reference!,
        name: audience.name,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating audience');
    }
  }

  async getAudiences(userId: number, filter: AudienceFilterDto, teamId: number): Promise<any> {
    try {
      // Validate input
      const { validatedData } = await this.audiencesValidator.validateGetAudiences(teamId, filter);

      // Set defaults from config
      const page = validatedData.filter.page || config.validation.pagination.defaultPage;
      const limit = validatedData.filter.limit || config.validation.pagination.defaultLimit;
      const offset = (page - 1) * limit;

      // Fetch audiences from repository
      const { data: audiences, total } = await this.audienceRepository.findWithFilter({
        teamId: validatedData.teamId,
        keyword: validatedData.filter.search,
        type: validatedData.filter.type,
        offset,
        limit,
      });

      return generateSuccessResponse({
        statusCode: 200,
        message: Constants.retrievedSuccessfully,
        data: audiences,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving audiences');
    }
  }

  async getAudienceContacts(audienceId: string, userId: number, filter: ContactFilterDto, teamId: number): Promise<any> {
    try {
      // Validate input and fetch audience
      const { validatedData } = await this.audiencesValidator.validateGetAudienceContacts(teamId, audienceId);

      // Fetch contacts from repository
      const contacts = await this.contactRepository.findByAudienceId(
        validatedData.audience.id as number,
        validatedData.teamId,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: contacts,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving audience contacts');
    }
  }

  async createContactInAudience(audienceId: string, userId: number, createContactDto: CreateContactDto, request: any): Promise<any> {
    try {
      // Validate input and fetch audience
      const { validatedData } = await this.audiencesValidator.validateCreateContact(
        request.user.teamId,
        userId,
        audienceId,
        createContactDto,
      );

      // Create contact in repository
      const contact = await this.contactRepository.create({
        email: validatedData.dto.email,
        firstName: validatedData.dto.firstName,
        lastName: validatedData.dto.lastName,
        unsubscribed: validatedData.dto.unsubscribed,
        tags: validatedData.dto.tags,
        metadata: validatedData.dto.metadata,
        teamId: validatedData.teamId,
        createdBy: validatedData.userId,
        audienceId: validatedData.audience.id as number, // Use the database ID
      });

      const response: CreateContactResponseDto = {
        id: contact.id,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.createdSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error creating contact');
    }
  }

  async getContactStatsByAudience(audienceId: string, userId: number, teamId: number): Promise<any> {
    try {
      // Validate input and fetch audience
      const { validatedData } = await this.audiencesValidator.validateGetAudience(teamId, audienceId);

      // Get contact stats from repository
      const stats = await this.contactRepository.getStatsByAudience(
        validatedData.audience.id as number,
        validatedData.teamId,
      );

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: stats,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving contact statistics');
    }
  }

  async getContactDetails(contactId: string, userId: number, audienceId: string, teamId: number): Promise<any> {
    try {
      // Validate input and fetch contact
      const { validatedData } = await this.audiencesValidator.validateGetContact(teamId, audienceId, contactId);

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.retrievedSuccessfully,
        data: validatedData.contact,
      });
    } catch (error) {
      return handleServiceError(error, 'Error retrieving contact details');
    }
  }

  async updateContact(contactId: string, userId: number, updateContactDto: UpdateContactDto, request: any, audienceId: string, teamId: number): Promise<any> {
    try {
      // Validate input and fetch contact
      const { validatedData } = await this.audiencesValidator.validateUpdateContact(
        teamId,
        audienceId,
        contactId,
        updateContactDto,
      );

      // Update contact in repository
      await this.contactRepository.update(
        validatedData.contact.id,
        {
          firstName: validatedData.dto.firstName,
          lastName: validatedData.dto.lastName,
          status: validatedData.status,
        },
      );

      const response: UpdateContactResponseDto = {
        id: validatedData.contact.reference,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.updatedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error updating contact');
    }
  }

  async deleteContact(contactId: string, userId: number, request: any, audienceId: string, teamId: number): Promise<any> {
    try {
      // Validate input and fetch contact
      const { validatedData } = await this.audiencesValidator.validateDeleteContact(
        teamId,
        audienceId,
        contactId,
      );

      // Delete contact from repository
      await this.contactRepository.delete(validatedData.contact.id);

      const response: DeleteContactResponseDto = {
        contact: validatedData.contact.reference,
      };

      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.deletedSuccessfully,
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error deleting contact');
    }
  }
}
