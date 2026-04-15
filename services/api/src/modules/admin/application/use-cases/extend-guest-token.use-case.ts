import { ExtendGuestTokenDto } from '#admin/application/dtos/extend-guest-token.dto';
import { InvalidExpirationDate } from '#admin/domain/exceptions/invalid-expiration-date';
import { TokenNotFoundError } from '#auth/domain/exceptions/token-not-found.error';
import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import {
  MAIL_SERVICE,
  type MailService,
} from '#auth/domain/services/mail.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ExtendGuestTokenResult {
  id: string;
  email: string;
  expiresAt: Date;
  activateUrl: string;
}

@Injectable()
export class ExtendGuestTokenUseCase {
  private readonly _frontendUrl: string;

  constructor(
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
    @Inject(MAIL_SERVICE)
    private readonly _mailService: MailService,
    private readonly _configService: ConfigService,
  ) {
    this._frontendUrl = this._configService.getOrThrow<string>('FRONTEND_URL');
  }

  async execute(
    id: string,
    dto: ExtendGuestTokenDto,
  ): Promise<ExtendGuestTokenResult> {
    const token = await this._guestTokenRepository.findById(id);

    if (!token) {
      throw new TokenNotFoundError();
    }

    if (dto.expiresAt <= new Date()) {
      throw new InvalidExpirationDate();
    }

    const updated = await this._guestTokenRepository.resetAndExtend(
      id,
      dto.expiresAt,
    );

    const activateUrl = `${this._frontendUrl}/auth/guest/activate?token=${updated.token}`;

    await this._mailService.sendGuestInvitation(
      updated.email,
      updated.firstName,
      activateUrl,
      updated.expiresAt,
    );

    return {
      id: updated.id,
      email: updated.email,
      expiresAt: updated.expiresAt,
      activateUrl,
    };
  }
}
