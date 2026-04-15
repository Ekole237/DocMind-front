export interface ProviderProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export const PROVIDER_SERVICE = Symbol('ProviderService');

export interface ProviderService {
  getAuthorizationUrl(): string;
  getProfile(code: string, accountsUrl?: string): Promise<ProviderProfile>;
}
