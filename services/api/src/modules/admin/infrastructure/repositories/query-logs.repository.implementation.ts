import {
  QueryLogsFilter,
  type QueryLogsRepository,
} from '#admin/domain/repositories/query-logs.repository';
import { QueryLogsMapper } from '#admin/infrastructure/persistence/query-logs.mapper';
import { Injectable } from '@nestjs/common';
import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';
import { PrismaService } from 'src/prisma/prisma.service';

const PAGE_SIZE = 10;

@Injectable()
export class QueryLogsRepositoryImplementation implements QueryLogsRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async listQueryLogs(filter: QueryLogsFilter): Promise<QueryLogEntity[]> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? PAGE_SIZE;
    const skip = (page - 1) * limit;

    const raws = await this._prismaService.queryLog.findMany({
      where: this._buildWhere(filter),
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    return raws.map((raw) => QueryLogsMapper.toDomain(raw));
  }

  async requestCount(filter: QueryLogsFilter): Promise<number> {
    return this._prismaService.queryLog.count({
      where: this._buildWhere(filter),
    });
  }

  private _buildWhere(filter: QueryLogsFilter) {
    return {
      ...(filter.from || filter.to
        ? {
            timestamp: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lte: filter.to } : {}),
            },
          }
        : {}),
      ...(filter.role ? { role: filter.role } : {}),
      ...(filter.flagged !== undefined ? { isFlagged: filter.flagged } : {}),
    };
  }
}
