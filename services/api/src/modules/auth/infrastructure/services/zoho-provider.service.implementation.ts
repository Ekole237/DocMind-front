import {
  ProviderProfile,
  ProviderService,
} from '#auth/domain/services/provider.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ZohoUserInfo = {
  Email: string;
  First_Name: string | null;
  Last_Name: string | null;
};

@Injectable()
export class ZohoProviderServiceImplementation implements ProviderService {
  private readonly _clientId: string;
  private readonly _clientSecret: string;
  private readonly _redirectUri: string;
  private readonly _accountsUrl: string;

  constructor(private readonly _configService: ConfigService) {
    this._clientId = this._configService.getOrThrow<string>('ZOHO_CLIENT_ID');
    this._clientSecret =
      this._configService.getOrThrow<string>('ZOHO_CLIENT_SECRET');
    this._redirectUri =
      this._configService.getOrThrow<string>('ZOHO_REDIRECT_URI');
    this._accountsUrl =
      this._configService.getOrThrow<string>('ZOHO_ACCOUNTS_URL');
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this._clientId,
      redirect_uri: this._redirectUri,
      response_type: 'code',
      scope: 'AaaServer.profile.Read',
      access_type: 'offline',
      prompt: 'login', // Force Zoho à toujours afficher l'écran de login + 2FA
    });

    return `${this._accountsUrl}/oauth/v2/auth?${params.toString()}`;
  }

  async getProfile(
    code: string,
    accountsUrl?: string,
  ): Promise<ProviderProfile> {
    const accessToken = await this.getAccessToken(code, accountsUrl);
    const userInfo = await this.getUserInfo(accessToken);

    console.log('[DEBUG] - ZOHO user info', userInfo);

    return {
      email: userInfo.Email,
      firstName: userInfo.First_Name,
      lastName: userInfo.Last_Name,
    };
  }

  private async getAccessToken(
    code: string,
    accountsUrl?: string,
  ): Promise<string> {
    const baseUrl = accountsUrl ?? this._accountsUrl;
    const response = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this._clientId,
        client_secret: this._clientSecret,
        redirect_uri: this._redirectUri,
        code,
      }),
    });

    const json = (await response.json()) as { access_token?: string };

    if (!json.access_token) {
      throw new Error('Failed to exchange authorization code');
    }

    return json.access_token;
  }

  private async getUserInfo(accessToken: string): Promise<ZohoUserInfo> {
    const response = await fetch(`${this._accountsUrl}/oauth/user/info`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve ZOHO user profile');
    }

    return response.json() as Promise<ZohoUserInfo>;
  }
}
