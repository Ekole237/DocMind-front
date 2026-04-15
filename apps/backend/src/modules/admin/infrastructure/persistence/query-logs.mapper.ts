import type { QueryLog as PrismaQueryLog } from '#prisma/client';
import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';

export class QueryLogsMapper {
  static toDomain(raw: PrismaQueryLog): QueryLogEntity {
    return QueryLogEntity.reconstitute(
      raw.id,
      raw.userIdHash,
      raw.question,
      raw.answer,
      raw.role,
      raw.isGuest,
      raw.isFlagged,
      raw.isIgnorance,
      raw.timestamp,
      raw.sourceDocId ?? null,
      raw.sourceDocName ?? null,
      raw.sourceDriveUrl ?? null,
      raw.responseTimeMs ?? null,
    );
  }

  static toOrm(
    log: QueryLogEntity,
  ): Omit<PrismaQueryLog, 'sourceDoc' | 'feedback'> {
    return {
      id: log.id,
      userIdHash: log.userIdHash,
      question: log.question,
      answer: log.answer,
      role: log.role,
      isGuest: log.isGuest,
      isFlagged: log.isFlagged,
      isIgnorance: log.isIgnorance,
      timestamp: log.timestamp,
      sourceDocId: log.sourceDocId,
      sourceDocName: log.sourceDocName,
      sourceDriveUrl: log.sourceDriveUrl,
      responseTimeMs: log.responseTimeMs,
    };
  }
}
