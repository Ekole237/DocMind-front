import { RequestMagicLinkDto } from '#auth/application/dto/request-magic-link.dto';
import { MagicLink } from '#auth/domain/entities/magic-link.entity';
import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import {
  MAGIC_LINK_REPOSITORY,
  type MagicLinkRepository,
} from '#auth/domain/repositories/magic-link.repository';
import {
  MAIL_SERVICE,
  type MailService,
} from '#auth/domain/services/mail.service';
import { Email } from '#auth/domain/values-objects/email.vo';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestMagicLinkUseCase {
  private readonly _appPublicUrl: string;

  constructor(
    @Inject(MAGIC_LINK_REPOSITORY)
    private readonly _magicLinkRepository: MagicLinkRepository,
    @Inject(GUEST_TOKEN_REPOSITORY)
    private readonly _guestTokenRepository: GuestTokenRepository,
    @Inject(MAIL_SERVICE)
    private readonly _mailService: MailService,
    private readonly _configService: ConfigService,
  ) {
    this._appPublicUrl =
      this._configService.getOrThrow<string>('APP_PUBLIC_URL');
  }

  async execute(dto: RequestMagicLinkDto): Promise<void> {
    // Honeypot — retour silencieux si rempli (sécurité par obscurité, conforme UC-05)
    if (dto._hp) {
      return;
    }

    const validEmail = Email.create(dto.email).value;
    console.log('[DEBUG] - validEmail', validEmail);

    const guestToken = await this._guestTokenRepository.findByEmail(validEmail);
    console.log('[DEBUG] - guestToken', guestToken);

    if (!guestToken || !guestToken.canReuseGuestToken()) {
      return;
    }

    const magicLink = MagicLink.create(validEmail);
    console.log('[DEBUG] - magicLink', magicLink);
    await this._magicLinkRepository.save(magicLink);

    const activateUrl = `${this._appPublicUrl}/auth/guest/magic-link/activate?token=${encodeURIComponent(magicLink.token)}`;

    await this._mailService.sendMagicLink(validEmail, activateUrl);
  }
}
