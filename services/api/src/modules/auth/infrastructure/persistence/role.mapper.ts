import { Role } from '#auth/domain/enums/role';
import {
  Role as PrismaRoleEnum,
  type Role as PrismaRole,
} from '#prisma/enums';

export class RoleMapper {
  static toDomainRole(role: PrismaRole): Role {
    const map: Record<PrismaRole, Role> = {
      [PrismaRoleEnum.EMPLOYEE]: Role.EMPLOYEE,
      [PrismaRoleEnum.ADMIN]: Role.ADMIN,
    };

    return map[role];
  }

  static toOrmRole(role: Role): PrismaRole {
    switch (role) {
      case Role.EMPLOYEE:
        return PrismaRoleEnum.EMPLOYEE;
      case Role.ADMIN:
        return PrismaRoleEnum.ADMIN;
      default:
        throw new Error(`Unhandled role: ${role as string}`);
    }
  }
}
