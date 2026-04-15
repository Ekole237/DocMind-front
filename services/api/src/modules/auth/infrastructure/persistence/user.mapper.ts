import { User } from '#auth/domain/entities/user.entity';
import { Email } from '#auth/domain/values-objects/email.vo';
import { Password } from '#auth/domain/values-objects/password.vo';
import type { User as PrismaUser } from '#prisma/client';
import { RoleMapper } from './role.mapper';

export class UserMapper {
  static toDomain(user: PrismaUser): User {
    return User.reconstitute(
      user.id,
      Email.create(user.email),
      user.password ? Password.fromHashed(user.password) : null,
      RoleMapper.toDomainRole(user.role),
      user.lastLogin,
      user.createdAt,
    );
  }

  static toOrm(user: User): PrismaUser {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: RoleMapper.toOrmRole(user.role),
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}
