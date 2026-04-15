import { ActiveGuestTokenUseCase } from '#auth/application/use-cases/active-guest-token.use-case';
import { ActivateMagicLinkUseCase } from '#auth/application/use-cases/active-magic-link.use-case';
import { LoginWithEmailAndPasswordUseCase } from '#auth/application/use-cases/login-with-email-and-password.use-case';
import { LoginWithProviderUseCase } from '#auth/application/use-cases/login-with-provider.use-case';
import { RequestMagicLinkUseCase } from '#auth/application/use-cases/request-magic-link.use-case';
import { GUEST_TOKEN_REPOSITORY } from '#auth/domain/repositories/guest-token.repository';
import { MAGIC_LINK_REPOSITORY } from '#auth/domain/repositories/magic-link.repository';
import { USER_REPOSITORY } from '#auth/domain/repositories/user.repository';
import { PASSWORD_SERVICE } from '#auth/domain/services/password.service';
import { PROVIDER_SERVICE } from '#auth/domain/services/provider.service';
import { TOKEN_SERVICE } from '#auth/domain/services/token.service';
import { GuestTokenRepositoryImplementation } from '#auth/infrastructure/repositories/guest-token.repository.implementation';
import { MagicLinkRepositoryImplementation } from '#auth/infrastructure/repositories/magic-link.repository.implementation';
import { UserRepositoryImplementation } from '#auth/infrastructure/repositories/user.repository.implementation';
import { PasswordServiceImplementation } from '#auth/infrastructure/services/password.service.implementation';
import { TokenServiceImplementation } from '#auth/infrastructure/services/token.service.implementation';
import { ZohoProviderServiceImplementation } from '#auth/infrastructure/services/zoho-provider.service.implementation';
import { AuthController } from '#auth/presentation/controllers/auth.controller';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../../core/mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ActiveGuestTokenUseCase,
    ActivateMagicLinkUseCase,
    LoginWithEmailAndPasswordUseCase,
    LoginWithProviderUseCase,
    RequestMagicLinkUseCase,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: UserRepositoryImplementation },
    {
      provide: GUEST_TOKEN_REPOSITORY,
      useClass: GuestTokenRepositoryImplementation,
    },
    {
      provide: MAGIC_LINK_REPOSITORY,
      useClass: MagicLinkRepositoryImplementation,
    },
    { provide: TOKEN_SERVICE, useClass: TokenServiceImplementation },
    { provide: PASSWORD_SERVICE, useClass: PasswordServiceImplementation },
    { provide: PROVIDER_SERVICE, useClass: ZohoProviderServiceImplementation },
  ],
  exports: [JwtModule, PassportModule, MailModule],
})
export class AuthModule {}
