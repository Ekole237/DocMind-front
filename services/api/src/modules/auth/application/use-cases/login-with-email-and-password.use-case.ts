import { LoginWithEmailAndPasswordDto } from '#auth/application/dto/login-with-email-and-password.dto';
import { InvalidCredentialsError } from '#auth/domain/exceptions/invalid-credentials.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '#auth/domain/repositories/user.repository';
import {
  PASSWORD_SERVICE,
  type PasswordService,
} from '#auth/domain/services/password.service';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '#auth/domain/services/token.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LoginWithEmailAndPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginWithEmailAndPasswordDto) {
    // Honeypot — si rempli, le bot reçoit la même erreur qu'un mauvais mot de passe
    if (dto._hp) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.canLoginWithPassword()) {
      throw new InvalidCredentialsError();
    }

    const isPasswordMatch = await this.passwordService.compare(
      dto.password,
      user.password as string,
    );

    if (!isPasswordMatch) {
      throw new InvalidCredentialsError();
    }

    return await this.tokenService.generate({
      sub: user.id,
      email: user.email,
      role: user.role,
      role_level: user.roleLevel,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });
  }
}
