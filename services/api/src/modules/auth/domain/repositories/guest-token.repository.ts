import { GuestToken } from '../entities/guest-token.entity';

export const GUEST_TOKEN_REPOSITORY = Symbol('GuestTokenRepository');

export interface GuestTokenListFilter {
  active?: boolean;
  page?: number;
}

export interface GuestTokenRepository {
  findById(id: string): Promise<GuestToken | null>;
  findByEmail(email: string): Promise<GuestToken | null>;
  findByToken(token: string): Promise<GuestToken | null>;
  listAll(
    filter: GuestTokenListFilter,
  ): Promise<{ tokens: GuestToken[]; total: number }>;
  markAsUsed(id: string): Promise<void>;
  extendExpiresAt(id: string, newExpiresAt: Date): Promise<void>;
  resetAndExtend(id: string, newExpiresAt: Date): Promise<GuestToken>;
  revokeById(id: string): Promise<void>;
  save(token: GuestToken): Promise<void>;
}
