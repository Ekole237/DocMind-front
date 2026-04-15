import { GuestToken } from '#auth/domain/entities/guest-token.entity';
import {
  GuestTokenListFilter,
  GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import { GuestTokenMapper } from '#auth/infrastructure/persistence/guest-token.mapper';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

const PAGE_SIZE = 20;

@Injectable()
export class GuestTokenRepositoryImplementation implements GuestTokenRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async findById(id: string): Promise<GuestToken | null> {
    const raw = await this._prismaService.guestToken.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return GuestTokenMapper.toDomainGuestToken(raw);
  }

  async listAll(
    filter: GuestTokenListFilter,
  ): Promise<{ tokens: GuestToken[]; total: number }> {
    const page = filter.page ?? 1;
    const skip = (page - 1) * PAGE_SIZE;

    const now = new Date();
    const where = filter.active === true ? { expiresAt: { gt: now } } : {};

    const [raws, total] = await Promise.all([
      this._prismaService.guestToken.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      this._prismaService.guestToken.count({ where }),
    ]);

    return {
      tokens: raws.map((raw) => GuestTokenMapper.toDomainGuestToken(raw)),
      total,
    };
  }

  async revokeById(id: string): Promise<void> {
    await this._prismaService.guestToken.delete({ where: { id } });
  }

  async findByEmail(email: string): Promise<GuestToken | null> {
    const guestToken = await this._prismaService.guestToken.findUnique({
      where: { email },
    });
    console.log('[DEBUG] IN REPOSITORY - guestToken', guestToken);

    if (!guestToken) {
      return null;
    }

    return GuestTokenMapper.toDomainGuestToken(guestToken);
  }

  async findByToken(token: string): Promise<GuestToken | null> {
    const guestToken = await this._prismaService.guestToken.findUnique({
      where: { token },
    });

    if (!guestToken) {
      return null;
    }

    return GuestTokenMapper.toDomainGuestToken(guestToken);
  }

  async markAsUsed(id: string): Promise<void> {
    await this._prismaService.guestToken.update({
      where: { id },
      data: {
        used: true,
      },
    });
  }

  async extendExpiresAt(id: string, newExpiresAt: Date): Promise<void> {
    await this._prismaService.guestToken.update({
      where: { id },
      data: { expiresAt: newExpiresAt },
    });
  }

  async resetAndExtend(id: string, newExpiresAt: Date): Promise<GuestToken> {
    const newToken = randomUUID();
    const raw = await this._prismaService.guestToken.update({
      where: { id },
      data: {
        token: newToken,
        used: false,
        expiresAt: newExpiresAt,
      },
    });
    return GuestTokenMapper.toDomainGuestToken(raw);
  }

  async save(token: GuestToken): Promise<void> {
    await this._prismaService.guestToken.upsert({
      where: { token: token.token },
      update: GuestTokenMapper.toOrm(token),
      create: GuestTokenMapper.toOrm(token),
    });
  }
}
