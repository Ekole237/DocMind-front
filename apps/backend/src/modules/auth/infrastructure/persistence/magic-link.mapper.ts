import { MagicLink } from '#auth/domain/entities/magic-link.entity';
import { UUID } from 'crypto';
import type { MagicLink as PrismaMagicLink } from '#prisma/client';

export class MagicLinkMapper {
  static toOrm(ml: MagicLink): PrismaMagicLink {
    return {
      id: ml.id,
      guestEmail: ml.guestEmail,
      token: ml.token,
      used: ml.used,
      expiresAt: ml.expiresAt,
      createdAt: ml.createdAt,
    };
  }

  static toDomain(raw: PrismaMagicLink): MagicLink {
    return MagicLink.reconstitute(
      raw.id,
      raw.guestEmail,
      raw.token as UUID,
      raw.used,
      raw.expiresAt,
      raw.createdAt,
    );
  }
}
