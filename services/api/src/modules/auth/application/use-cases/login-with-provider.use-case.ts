import { LoginWithProviderDto } from '#auth/application/dto/login-with-provider.dto';
import { User } from '#auth/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '#auth/domain/repositories/user.repository';
import {
  PROVIDER_SERVICE,
  type ProviderService,
} from '#auth/domain/services/provider.service';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '#auth/domain/services/token.service';
import { Email } from '#auth/domain/values-objects/email.vo';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LoginWithProviderUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDER_SERVICE)
    private readonly providerService: ProviderService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginWithProviderDto, accountsUrl?: string): Promise<string> {
    let user: User;

    const providerUser = await this.providerService.getProfile(dto.code, accountsUrl);

    const existingUser = await this.userRepository.findByEmail(
      providerUser.email,
    );

    if (existingUser) {
      user = existingUser;
    } else {
      user = User.create(Email.create(providerUser.email));
      await this.userRepository.save(user);
    }

    return await this.tokenService.generate({
      sub: user.id,
      email: user.email,
      role: user.role,
      role_level: user.roleLevel,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
    });
  }
}
