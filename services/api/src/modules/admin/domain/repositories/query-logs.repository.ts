import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';

export const QUERY_LOGS_REPOSITORY = Symbol('QueryLogsRepository');

export interface QueryLogsRepository {
  listQueryLogs(filter: QueryLogsFilter): Promise<QueryLogEntity[]>;
  requestCount(filter: QueryLogsFilter): Promise<number>;
}

export interface QueryLogsFilter {
  from?: Date;
  role?: string;
  flagged?: boolean;
  page?: number;
  to?: Date;
  limit?: number;
}
