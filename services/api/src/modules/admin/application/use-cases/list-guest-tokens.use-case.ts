import {
  GUEST_TOKEN_REPOSITORY,
  GuestTokenListFilter,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import { GuestToken } from '#auth/domain/entities/guest-token.entity';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListGuestTokensUseCase {
  constructor(
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
  ) {}

  async execute(
    filter: GuestTokenListFilter,
  ): Promise<{ tokens: GuestToken[]; total: number }> {
    return await this._guestTokenRepository.listAll(filter);
  }
}
