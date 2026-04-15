import {
  QUERY_LOGS_REPOSITORY,
  QueryLogsFilter,
  type QueryLogsRepository,
} from '#admin/domain/repositories/query-logs.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListQueryLogsUseCase {
  constructor(
    @Inject(QUERY_LOGS_REPOSITORY)
    private readonly _queryLogsRepository: QueryLogsRepository,
  ) {}

  async execute(filter: QueryLogsFilter) {
    return await this._queryLogsRepository.listQueryLogs(filter);
  }
}
