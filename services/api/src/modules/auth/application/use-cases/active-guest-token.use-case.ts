import { ActiveGuestTokenDto } from '#auth/application/dto/active-guest-token.dto';
import { GuestAccessExpiredError } from '#auth/domain/exceptions/guest-access-expired.error';
import { TokenAlreadyUsedError } from '#auth/domain/exceptions/token-already-used.error';
import { TokenNotFoundError } from '#auth/domain/exceptions/token-not-found.error';
import { Role } from '#auth/domain/enums/role';
import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '#auth/domain/services/token.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ActiveGuestTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly _tokenService: TokenService,
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
  ) {}

  async execute(dto: ActiveGuestTokenDto): Promise<string> {
    const guestToken = await this._guestTokenRepository.findByToken(dto.token);
    if (!guestToken) {
      throw new TokenNotFoundError();
    }

    if (guestToken.used) {
      throw new TokenAlreadyUsedError();
    }

    if (guestToken.expiresAt <= new Date()) {
      throw new GuestAccessExpiredError();
    }

    await this._guestTokenRepository.markAsUsed(guestToken.id);

    return await this._tokenService.generate({
      sub: guestToken.id,
      email: guestToken.email,
      role: Role.EMPLOYEE,
      role_level: 0,
      is_guest: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(guestToken.expiresAt.getTime() / 1000),
    });
  }
}
