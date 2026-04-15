import { type RoleLevel } from '../entities/user.entity';
import { Role } from '../enums/role';

export const TOKEN_SERVICE = Symbol('TokenService');

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  role_level: RoleLevel;
  is_guest?: boolean;
  iat: number;
  exp: number;
}

export interface TokenService {
  generate(payload: JwtPayload): Promise<string>;
  decode(token: string): Promise<JwtPayload>;
}
