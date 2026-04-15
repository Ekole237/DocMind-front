import { MagicLink } from '#auth/domain/entities/magic-link.entity';
import { MagicLinkRepository } from '#auth/domain/repositories/magic-link.repository';
import { MagicLinkMapper } from '#auth/infrastructure/persistence/magic-link.mapper';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MagicLinkRepositoryImplementation implements MagicLinkRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async save(token: MagicLink): Promise<void> {
    await this._prisma.magicLink.upsert({
      where: { token: token.token },
      update: MagicLinkMapper.toOrm(token),
      create: MagicLinkMapper.toOrm(token),
    });
  }

  async findByToken(token: string): Promise<MagicLink | null> {
    const magicLink = await this._prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return null;
    }

    return MagicLinkMapper.toDomain(magicLink);
  }

  async markAsUsed(id: string): Promise<void> {
    await this._prisma.magicLink.update({
      where: { id },
      data: {
        used: true,
      },
    });
  }
}
