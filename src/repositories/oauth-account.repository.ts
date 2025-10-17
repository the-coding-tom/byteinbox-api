import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import prisma from '../common/prisma';

@Injectable()
export class OAuthAccountRepository {
  async findByProviderAndUserId(provider: OAuthProvider, providerUserId: string): Promise<any> {
    return prisma.oAuthAccount.findFirst({
      where: {
        provider,
        providerUserId,
      },
      include: {
        User: true,
      },
    });
  }

  async create(userId: number, provider: OAuthProvider, providerUserId: string, accessToken?: string): Promise<any> {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider,
        providerUserId,
        accessToken,
      },
    });
  }

  async update(id: number, data: any): Promise<any> {
    return prisma.oAuthAccount.update({
      where: { id },
      data,
    });
  }
}

