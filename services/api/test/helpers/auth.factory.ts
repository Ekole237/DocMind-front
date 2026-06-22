import { JwtService } from '@nestjs/jwt';
import { Role } from '../../src/modules/auth/domain/enums/role';
import { ROLE_LEVELS } from '../../src/modules/auth/domain/entities/user.entity';

export interface TokenOptions {
  sub?: string;
  email?: string;
  role?: Role;
  is_guest?: boolean;
  exp?: number;
}

const DEFAULT_EMPLOYEE_JWT = {
  sub: 'employee-test-id',
  email: 'employee@entreprise.com',
  role: Role.EMPLOYEE,
  role_level: ROLE_LEVELS[Role.EMPLOYEE],
  is_guest: false,
};

const DEFAULT_ADMIN_JWT = {
  sub: 'admin-test-id',
  email: 'admin@entreprise.com',
  role: Role.ADMIN,
  role_level: ROLE_LEVELS[Role.ADMIN],
  is_guest: false,
};

const DEFAULT_GUEST_JWT = {
  sub: 'guest-test-id',
  email: 'guest@gmail.com',
  role: Role.EMPLOYEE,
  role_level: ROLE_LEVELS[Role.EMPLOYEE],
  is_guest: true,
};

export async function generateToken(
  jwtService: JwtService,
  overrides: TokenOptions = {},
): Promise<string> {
  const base =
    overrides.role === Role.ADMIN
      ? DEFAULT_ADMIN_JWT
      : overrides.is_guest
        ? DEFAULT_GUEST_JWT
        : DEFAULT_EMPLOYEE_JWT;

  const payload = {
    ...base,
    ...overrides,
    iat: Math.floor(Date.now() / 1000),
    exp: overrides.exp ?? Math.floor(Date.now() / 1000) + 3600,
  };

  return jwtService.signAsync(payload);
}

export async function generateAdminToken(
  jwtService: JwtService,
  overrides: TokenOptions = {},
): Promise<string> {
  return generateToken(jwtService, { role: Role.ADMIN, ...overrides });
}

export async function generateEmployeeToken(
  jwtService: JwtService,
  overrides: TokenOptions = {},
): Promise<string> {
  return generateToken(jwtService, { role: Role.EMPLOYEE, ...overrides });
}

export async function generateGuestToken(
  jwtService: JwtService,
  overrides: TokenOptions = {},
): Promise<string> {
  return generateToken(jwtService, {
    is_guest: true,
    role: Role.EMPLOYEE,
    ...overrides,
  });
}
