import { MagicLink } from '#auth/domain/entities/magic-link.entity';

export const MAGIC_LINK_REPOSITORY = Symbol('MagicLinkRepository');

export interface MagicLinkRepository {
  findByToken(token: string): Promise<MagicLink | null>;
  markAsUsed(id: string): Promise<void>;
  save(token: MagicLink): Promise<void>;
}
