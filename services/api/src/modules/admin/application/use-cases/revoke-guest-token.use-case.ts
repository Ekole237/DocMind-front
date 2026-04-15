import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import { TokenNotFoundError } from '#auth/domain/exceptions/token-not-found.error';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RevokeGuestTokenUseCase {
  constructor(
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const token = await this._guestTokenRepository.findById(id);

    if (!token) {
      throw new TokenNotFoundError();
    }

    await this._guestTokenRepository.revokeById(id);
  }
}
