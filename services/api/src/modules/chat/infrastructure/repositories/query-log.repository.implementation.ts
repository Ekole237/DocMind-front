import { type QueryLogRepository } from '#chat/domain/repositories/query-log.repository';
import { QueryLogMapper } from '#chat/infrastructure/persistence/query-log.mapper';
import { Injectable } from '@nestjs/common';
import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QueryLogRepositoryImplementation implements QueryLogRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async save(log: QueryLogEntity): Promise<void> {
    await this._prismaService.queryLog.create({
      data: QueryLogMapper.toOrm(log),
    });
  }

  async findById(id: string): Promise<QueryLogEntity | null> {
    const raw = await this._prismaService.queryLog.findUnique({
      where: { id },
    });
    return raw ? QueryLogMapper.toDomain(raw) : null;
  }

  async findByUserHash(
    userHash: string,
    page: number,
    limit: number,
  ): Promise<QueryLogEntity[]> {
    const skip = (page - 1) * limit;
    const raws = await this._prismaService.queryLog.findMany({
      where: { userIdHash: userHash },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });
    return raws.map((raw) => QueryLogMapper.toDomain(raw));
  }

  async countByUserHash(userHash: string): Promise<number> {
    return this._prismaService.queryLog.count({
      where: { userIdHash: userHash },
    });
  }

  async flagById(id: string): Promise<void> {
    await this._prismaService.queryLog.update({
      where: { id },
      data: { isFlagged: true },
    });
  }
}
