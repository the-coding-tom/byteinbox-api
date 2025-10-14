import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateContactDto, UpdateContactDto } from './dto/audiences.dto';

@Injectable()
export class AudiencesValidator {
  async validateCreateContact(createContactDto: CreateContactDto): Promise<void> {
    if (!createContactDto.email) {
      throw new BadRequestException('Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createContactDto.email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  async validateUpdateContact(updateContactDto: UpdateContactDto): Promise<void> {
    // At least one field should be provided for update
    if (!updateContactDto.firstName && !updateContactDto.lastName &&
        !updateContactDto.tags && !updateContactDto.metadata) {
      throw new BadRequestException('At least one field is required for update');
    }
  }
}
