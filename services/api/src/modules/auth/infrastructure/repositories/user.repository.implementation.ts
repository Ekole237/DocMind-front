import { User } from '#auth/domain/entities/user.entity';
import { type UserRepository } from '#auth/domain/repositories/user.repository';
import { UserMapper } from '#auth/infrastructure/persistence/user.mapper';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepositoryImplementation implements UserRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this._prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return UserMapper.toDomain(user);
  }
  async updateLastLogin(id: string): Promise<void> {
    await this._prismaService.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
      },
    });
  }
  async save(user: User): Promise<void> {
    await this._prismaService.user.upsert({
      where: { email: user.email },
      update: UserMapper.toOrm(user),
      create: UserMapper.toOrm(user),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this._prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return UserMapper.toDomain(user);
  }
}
