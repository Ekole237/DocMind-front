import { ActiveMagicLinkDto } from '#auth/application/dto/active-magic-link.dto';
import { TokenAlreadyUsedError } from '#auth/domain/exceptions/token-already-used.error';
import { TokenExpiredError } from '#auth/domain/exceptions/token-expired.error';
import { TokenNotFoundError } from '#auth/domain/exceptions/token-not-found.error';
import { Role } from '#auth/domain/enums/role';
import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import {
  MAGIC_LINK_REPOSITORY,
  type MagicLinkRepository,
} from '#auth/domain/repositories/magic-link.repository';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '#auth/domain/services/token.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ActivateMagicLinkUseCase {
  constructor(
    @Inject(MAGIC_LINK_REPOSITORY)
    private readonly _magicLinkRepository: MagicLinkRepository,
    @Inject(TOKEN_SERVICE)
    private readonly _tokenService: TokenService,
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
  ) {}

  async execute(dto: ActiveMagicLinkDto): Promise<string> {
    const magicLink = await this._magicLinkRepository.findByToken(dto.token);

    if (!magicLink) {
      throw new TokenNotFoundError();
    }

    if (magicLink.used) {
      throw new TokenAlreadyUsedError();
    }

    if (magicLink.isExpired()) {
      throw new TokenExpiredError();
    }

    await this._magicLinkRepository.markAsUsed(magicLink.id);

    const guestToken = await this._guestTokenRepository.findByEmail(
      magicLink.guestEmail,
    );

    if (!guestToken) {
      throw new Error('Aucun token invité trouvé pour cet email');
    }

    return await this._tokenService.generate({
      sub: guestToken.id,
      email: magicLink.guestEmail,
      role: Role.EMPLOYEE,
      role_level: 0,
      is_guest: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(guestToken.expiresAt.getTime() / 1000),
    });
  }
}
