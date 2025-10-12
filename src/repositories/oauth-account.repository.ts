import { Injectable } from '@nestjs/common';
import prisma from '../common/prisma';

@Injectable()
export class OAuthAccountRepository {
  async findByProviderAndUserId(provider: string, providerUserId: string): Promise<any> {
    return prisma.oAuthAccount.findFirst({
      where: {
        provider: provider as any,
        providerUserId,
      },
      include: {
        User: true,
      },
    });
  }

  async create(userId: number, provider: string, providerUserId: string, accessToken?: string): Promise<any> {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider: provider as any,
        providerUserId,
        accessToken,
      },
    });
  }
}

