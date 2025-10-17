import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';
import { VerificationRequestType } from '@prisma/client';

@Injectable()
export class VerificationRequestRepository {
  async findByToken(token: string): Promise<any> {
    return prisma.verificationRequest.findUnique({
      where: {
        token,
      },
      include: {
        User: true,
      },
    });
  }

  async create(userId: number, email: string, token: string, type: VerificationRequestType, expiresAt: Date): Promise<any> {
    return prisma.verificationRequest.create({
      data: {
        userId,
        email,
        token,
        type,
        expiresAt,
      },
    });
  }

  async update(id: number, data: Partial<any>): Promise<any> {
    return prisma.verificationRequest.update({
      where: { id },
      data,
    });
  }

  async updateByUserId(userId: number, type: VerificationRequestType, data: Partial<any>): Promise<any> {
    return prisma.verificationRequest.updateMany({
      where: { 
        userId,
        type,
      },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.verificationRequest.delete({
      where: { id },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.verificationRequest.deleteMany({
      where: { token },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.verificationRequest.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  async deleteByUserIdAndType(userId: number, type: VerificationRequestType): Promise<void> {
    await prisma.verificationRequest.deleteMany({
      where: {
        userId,
        type,
      },
    });
  }
}
