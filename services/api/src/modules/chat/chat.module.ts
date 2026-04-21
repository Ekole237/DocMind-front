import { GetHistoryUseCase } from '#chat/application/use-cases/get-history.use-case';
import { QueryRagUseCase } from '#chat/application/use-cases/query-rag.use-case';
import { SubmitFeedbackUseCase } from '#chat/application/use-cases/submit-feedback.use-case';
import { ListSessionsUseCase } from '#chat/application/use-cases/list-sessions.use-case';
import { GetSessionLogsUseCase } from '#chat/application/use-cases/get-session-logs.use-case';
import { FEEDBACK_REPOSITORY } from '#chat/domain/repositories/feedback.repository';
import { QUERY_LOG_REPOSITORY } from '#chat/domain/repositories/query-log.repository';
import { LLM_SERVICE } from '#chat/domain/services/llm.service';
import { VECTOR_SEARCH_SERVICE } from '#chat/domain/services/vector-search.service';
import { FeedbackRepositoryImplementation } from '#chat/infrastructure/repositories/feedback.repository.implementation';
import { QueryLogRepositoryImplementation } from '#chat/infrastructure/repositories/query-log.repository.implementation';
import { LlmServiceImplementation } from '#chat/infrastructure/services/llm.service.implementation';
import { CHAT_SESSION_REPOSITORY } from '#chat/domain/repositories/chat-session.repository';
import { ChatSessionRepositoryImplementation } from '#chat/infrastructure/repositories/chat-session.repository.implementation';
import { PromptBuilder } from '#chat/infrastructure/services/prompt-builder';
import { VectorSearchServiceImplementation } from '#chat/infrastructure/services/vector-search.service.implementation';
import { ChatController } from '#chat/presentation/controllers/chat.controller';
import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QdrantModule } from '../../qdrant/qdrant.module';

@Module({
  imports: [PrismaModule, QdrantModule, AuthModule],
  controllers: [ChatController],
  providers: [
    // Use cases
    QueryRagUseCase,
    SubmitFeedbackUseCase,
    GetHistoryUseCase,
    ListSessionsUseCase,
    GetSessionLogsUseCase,
    // Infrastructure services
    PromptBuilder,
    {
      provide: LLM_SERVICE,
      useClass: LlmServiceImplementation,
    },
    {
      provide: VECTOR_SEARCH_SERVICE,
      useClass: VectorSearchServiceImplementation,
    },
    // Repository implementations
    {
      provide: QUERY_LOG_REPOSITORY,
      useClass: QueryLogRepositoryImplementation,
    },
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: FeedbackRepositoryImplementation,
    },
    {
      provide: CHAT_SESSION_REPOSITORY,
      useClass: ChatSessionRepositoryImplementation,
    },
  ],
})
export class ChatModule {}
