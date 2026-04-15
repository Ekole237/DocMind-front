import { ActiveGuestTokenDto } from '#auth/application/dto/active-guest-token.dto';
import { ActiveMagicLinkDto } from '#auth/application/dto/active-magic-link.dto';
import { LoginWithEmailAndPasswordDto } from '#auth/application/dto/login-with-email-and-password.dto';
import { LoginWithProviderDto } from '#auth/application/dto/login-with-provider.dto';
import { RequestMagicLinkDto } from '#auth/application/dto/request-magic-link.dto';
import { ActiveGuestTokenUseCase } from '#auth/application/use-cases/active-guest-token.use-case';
import { ActivateMagicLinkUseCase } from '#auth/application/use-cases/active-magic-link.use-case';
import { LoginWithEmailAndPasswordUseCase } from '#auth/application/use-cases/login-with-email-and-password.use-case';
import { LoginWithProviderUseCase } from '#auth/application/use-cases/login-with-provider.use-case';
import { RequestMagicLinkUseCase } from '#auth/application/use-cases/request-magic-link.use-case';
import {
  PROVIDER_SERVICE,
  type ProviderService,
} from '#auth/domain/services/provider.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Redirect,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  private readonly _frontendUrl: string;

  constructor(
    private readonly _loginWithEmailAndPasswordUseCase: LoginWithEmailAndPasswordUseCase,
    private readonly _loginWithProviderUseCase: LoginWithProviderUseCase,
    private readonly _activeGuestTokenUseCase: ActiveGuestTokenUseCase,
    private readonly _requestMagicLinkUseCase: RequestMagicLinkUseCase,
    private readonly _activateMagicLinkUseCase: ActivateMagicLinkUseCase,
    @Inject(PROVIDER_SERVICE)
    private readonly _providerService: ProviderService,
    private readonly _configService: ConfigService,
  ) {
    this._frontendUrl = this._configService.getOrThrow<string>('FRONTEND_URL');
  }

  // ─── EMPLOYEE (ZOHO) ────────────────────────────────────────────────────────

  @Get('zoho')
  @Redirect()
  zoho() {
    return {
      url: this._providerService.getAuthorizationUrl(),
      statusCode: 302,
    };
  }

  @Get('zoho/callback')
  async zohoCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('accounts-server') accountsServer: string | undefined,
    @Res() res: FastifyReply,
  ) {
    if (error === 'access_denied') {
      return res.redirect(`${this._frontendUrl}/login?error=cancelled`, 302);
    }
    if (error === 'server') {
      return res.redirect(`${this._frontendUrl}/login?error=server`, 302);
    }

    try {
      const dto: LoginWithProviderDto = { code };
      const token = await this._loginWithProviderUseCase.execute(
        dto,
        accountsServer,
      );
      return res.redirect(
        `${this._frontendUrl}/auth/callback?token=${token}`,
        302,
      );
    } catch (err) {
      console.error('Zoho OAuth error:', err);
      return res.redirect(`${this._frontendUrl}/login?error=server`, 302);
    }
  }

  // ─── ADMIN (email/password) ──────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 5 } })
  async login(@Body() dto: LoginWithEmailAndPasswordDto) {
    return await this._loginWithEmailAndPasswordUseCase.execute(dto);
  }

  // ─── GUEST (première connexion via QR code) ──────────────────────────────────

  @Get('guest/activate')
  async activateGuestToken(@Query() dto: ActiveGuestTokenDto) {
    const access_token = await this._activeGuestTokenUseCase.execute(dto);
    return { access_token };
  }

  // ─── GUEST (connexions suivantes via magic link) ──────────────────────────────

  @Post('guest/magic-link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60 * 1000, limit: 3 } })
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    await this._requestMagicLinkUseCase.execute(dto);
    return {
      message:
        'Si cet email est associé à un accès actif, un lien vous a été envoyé. Vérifiez votre boite mail.',
    };
  }

  @Get('guest/magic-link/activate')
  async activateMagicLink(@Query() dto: ActiveMagicLinkDto) {
    const access_token = await this._activateMagicLinkUseCase.execute(dto);
    return { access_token };
  }
}
