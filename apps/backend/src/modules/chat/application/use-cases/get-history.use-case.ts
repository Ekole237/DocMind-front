import {
  QUERY_LOG_REPOSITORY,
  type QueryLogRepository,
} from '#chat/domain/repositories/query-log.repository';
import { Inject, Injectable } from '@nestjs/common';
import { hashUserId } from 'src/core/utils/hash.util';
import { GetHistoryDto } from '../dto/get-history.dto';

export interface QueryLogSummary {
  id: string;
  question: string;
  answer: string;
  sourceDocName: string | null;
  isFlagged: boolean;
  isIgnorance: boolean;
  timestamp: Date;
}

export interface HistoryResponse {
  logs: QueryLogSummary[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetHistoryUseCase {
  constructor(
    @Inject(QUERY_LOG_REPOSITORY)
    private readonly _queryLogRepository: QueryLogRepository,
  ) {}

  async execute(dto: GetHistoryDto, userId: string): Promise<HistoryResponse> {
    const userHash = hashUserId(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [logs, total] = await Promise.all([
      this._queryLogRepository.findByUserHash(userHash, page, limit),
      this._queryLogRepository.countByUserHash(userHash),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        question: log.question,
        answer: log.answer,
        sourceDocName: log.sourceDocName,
        isFlagged: log.isFlagged,
        isIgnorance: log.isIgnorance,
        timestamp: log.timestamp,
      })),
      total,
      page,
      limit,
    };
  }
}
