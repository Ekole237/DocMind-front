import { ClassifyDocumentUseCase } from '#admin/application/use-cases/classify-document.use-case';
import { CreateGuestTokenUseCase } from '#admin/application/use-cases/create-guest-token.use-case';
import { DashboardUseCase } from '#admin/application/use-cases/dashboard.use-case';
import { DeleteDocumentUseCase } from '#admin/application/use-cases/delete-document.use-case';
import { DisableDocumentUseCase } from '#admin/application/use-cases/disable-document.use-case';
import { EnableDocumentUseCase } from '#admin/application/use-cases/enable-document.use-case';
import { ExtendGuestTokenUseCase } from '#admin/application/use-cases/extend-guest-token.use-case';
import { ImportDocumentUseCase } from '#admin/application/use-cases/import-document.use-case';
import { IndexDocumentUseCase } from '#admin/application/use-cases/index-document.use-case';
import { ListAllDocumentsUseCase } from '#admin/application/use-cases/list-all-documents.use-case';
import { ListFeedbacksUseCase } from '#admin/application/use-cases/list-feelbacks.use-case';
import { ListGuestTokensUseCase } from '#admin/application/use-cases/list-guest-tokens.use-case';
import { ListQueryLogsUseCase } from '#admin/application/use-cases/list-query.use-case';
import { ReindexAllUseCase } from '#admin/application/use-cases/reindex-all.use-case';
import { ResolveFeedbackUseCase } from '#admin/application/use-cases/resolve-feedback.use-case';
import { RevokeGuestTokenUseCase } from '#admin/application/use-cases/revoke-guest-token.use-case';
import { DOCUMENT_REPOSITORY } from '#admin/domain/repositories/document.repository';
import { FEEDBACK_REPOSITORY } from '#admin/domain/repositories/feedback.repository';
import { QUERY_LOGS_REPOSITORY } from '#admin/domain/repositories/query-logs.repository';
import { FILE_STORAGE_SERVICE } from '#admin/domain/services/file-storage.service';
import { VECTOR_STORE_SERVICE } from '#admin/domain/services/vector-store.service';
import { DocumentRepositoryImplementation } from '#admin/infrastructure/repositories/document.repository.implementation';
import { FeedbackRepositoryImplementation } from '#admin/infrastructure/repositories/feedback.repository.implementation';
import { FileStorageServiceImplementation } from '#admin/infrastructure/services/file-storage.service.implementation';
import { QueryLogsRepositoryImplementation } from '#admin/infrastructure/repositories/query-logs.repository.implementation';
import { VectorStoreServiceImplementation } from '#admin/infrastructure/services/vector-store.service.implementation';
import { AdminController } from '#admin/presentation/controllers/admin.controller';
import { GUEST_TOKEN_REPOSITORY } from '#auth/domain/repositories/guest-token.repository';
import { GuestTokenRepositoryImplementation } from '#auth/infrastructure/repositories/guest-token.repository.implementation';
import { Module } from '@nestjs/common';
import { MailModule } from '../../core/mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { QdrantModule } from '../../qdrant/qdrant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, QdrantModule, MailModule, AuthModule],
  controllers: [AdminController],
  providers: [
    // Use cases — Documents
    DashboardUseCase,
    ListAllDocumentsUseCase,
    ImportDocumentUseCase,
    ClassifyDocumentUseCase,
    IndexDocumentUseCase,
    DisableDocumentUseCase,
    EnableDocumentUseCase,
    DeleteDocumentUseCase,
    ReindexAllUseCase,
    // Use cases — Feedbacks
    ListFeedbacksUseCase,
    ResolveFeedbackUseCase,
    // Use cases — Logs
    ListQueryLogsUseCase,
    // Use cases — Guests
    ListGuestTokensUseCase,
    CreateGuestTokenUseCase,
    ExtendGuestTokenUseCase,
    RevokeGuestTokenUseCase,
    // Repository implementations
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: DocumentRepositoryImplementation,
    },
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: FeedbackRepositoryImplementation,
    },
    {
      provide: QUERY_LOGS_REPOSITORY,
      useClass: QueryLogsRepositoryImplementation,
    },
    {
      provide: GUEST_TOKEN_REPOSITORY,
      useClass: GuestTokenRepositoryImplementation,
    },
    // Domain service implementations
    {
      provide: VECTOR_STORE_SERVICE,
      useClass: VectorStoreServiceImplementation,
    },
    {
      provide: FILE_STORAGE_SERVICE,
      useClass: FileStorageServiceImplementation,
    },
  ],
})
export class AdminModule {}
