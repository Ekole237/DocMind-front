import { GuestToken } from '#auth/domain/entities/guest-token.entity';
import type { GuestToken as PrismaGuestToken } from '#prisma/client';
import { UUID } from 'crypto';

export class GuestTokenMapper {
  static toDomainGuestToken(raw: PrismaGuestToken): GuestToken {
    return GuestToken.reconstitute(
      raw.id as UUID,
      raw.email,
      raw.firstName,
      raw.lastName,
      raw.token as UUID,
      raw.used,
      raw.createdBy,
      raw.expiresAt,
      raw.createdAt,
    );
  }

  static toOrm(guestToken: GuestToken): PrismaGuestToken {
    return {
      id: guestToken.id,
      email: guestToken.email,
      firstName: guestToken.firstName,
      lastName: guestToken.lastName,
      token: guestToken.token,
      used: guestToken.used,
      createdBy: guestToken.createdBy,
      expiresAt: guestToken.expiresAt,
      createdAt: guestToken.createdAt,
      isGuest: guestToken.isGuest,
    };
  }
}
