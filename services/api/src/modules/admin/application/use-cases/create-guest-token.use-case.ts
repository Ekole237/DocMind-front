import { CreateGuestTokenDto } from '#admin/application/dtos/create-guest-token.dto';
import { InvalidGuestToken } from '#admin/domain/exceptions/invalid-guest-token';
import { UserExist } from '#admin/domain/exceptions/user-exist';
import { GuestToken } from '#auth/domain/entities/guest-token.entity';
import {
  GUEST_TOKEN_REPOSITORY,
  type GuestTokenRepository,
} from '#auth/domain/repositories/guest-token.repository';
import {
  MAIL_SERVICE,
  type MailService,
} from '#auth/domain/services/mail.service';
import { Email } from '#auth/domain/values-objects/email.vo';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreateGuestTokenResult {
  id: string;
  email: string;
  expiresAt: Date;
  activateUrl: string;
  createdAt: Date;
}

@Injectable()
export class CreateGuestTokenUseCase {
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
    dto: CreateGuestTokenDto,
    adminId: string,
  ): Promise<CreateGuestTokenResult> {
    const validEmail = Email.create(dto.email);

    if (!dto.firstName || !dto.lastName) {
      throw new InvalidGuestToken();
    }

    const isUserAlreadyRegistered =
      await this._guestTokenRepository.findByEmail(validEmail.value);

    if (isUserAlreadyRegistered) {
      throw new UserExist(validEmail.value);
    }

    const token = GuestToken.create(
      validEmail.value,
      dto.firstName,
      dto.lastName,
      dto.expiresAt,
      adminId,
    );

    await this._guestTokenRepository.save(token);

    const activateUrl = `${this._frontendUrl}/auth/guest/activate?token=${token.token}`;

    // Send invitation email
    await this._mailService.sendGuestInvitation(
      validEmail.value,
      dto.firstName,
      activateUrl,
      token.expiresAt,
    );

    return {
      id: token.id,
      email: token.email,
      expiresAt: token.expiresAt,
      activateUrl,
      createdAt: token.createdAt,
    };
  }
}
