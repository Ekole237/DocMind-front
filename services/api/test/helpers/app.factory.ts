import { Test, TestingModuleBuilder } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/core/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { LLM_SERVICE } from '../../src/modules/chat/domain/services/llm.service';
import { EMBEDDING_SERVICE } from '../../src/core/embedding/embedding.service';
import { PROVIDER_SERVICE } from '../../src/modules/auth/domain/services/provider.service';
import { MAIL_SERVICE } from '../../src/modules/auth/domain/services/mail.service';
import { VECTOR_SEARCH_SERVICE } from '../../src/modules/chat/domain/services/vector-search.service';
import { VECTOR_STORE_SERVICE } from '../../src/modules/admin/domain/services/vector-store.service';

export async function createTestingApp(
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<NestFastifyApplication> {
  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  builder = builder
    .overrideProvider(LLM_SERVICE)
    .useValue(mockLlmService)
    .overrideProvider(EMBEDDING_SERVICE)
    .useValue(mockEmbeddingService)
    .overrideProvider(PROVIDER_SERVICE)
    .useValue(mockProviderService)
    .overrideProvider(MAIL_SERVICE)
    .useValue(mockMailService)
    .overrideProvider(VECTOR_SEARCH_SERVICE)
    .useValue(mockVectorSearchService)
    .overrideProvider(VECTOR_STORE_SERVICE)
    .useValue(mockVectorStoreService);

  if (customize) {
    builder = customize(builder);
  }

  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.register(cookie, {
    secret: process.env.JWT_SECRET ?? 'test-secret',
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: false,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

const mockLlmService = {
  classifyIntent: () => 'SEARCH' as const,
  condenseQuestion: (_history: unknown[], question: string) => question,
  complete: () =>
    Promise.resolve({
      answer: 'Réponse de test basée sur les documents fournis.',
      exactQuote: null,
      sourceChunkId: null,
    }),
  completeConversational: () =>
    Promise.resolve('Réponse conversationnelle de test.'),
};

const mockEmbeddingService = {
  embed: () => Promise.resolve(new Array(384).fill(0.1)),
  embedBatch: () => Promise.resolve([new Array(384).fill(0.1)]),
};

const mockProviderService = {
  getAuthorizationUrl: () => 'https://accounts.zoho.eu/oauth/v2/auth?mock=1',
  getProfile: async () => ({
    email: 'employee@entreprise.com',
    firstName: 'John',
    lastName: 'Doe',
  }),
};

const mockMailService = {
  sendMagicLink: async () => {},
  sendGuestInvitation: async () => {},
};

const mockVectorSearchService = {
  searchChunks: async () => [],
};

const mockVectorStoreService = {
  indexDocument: async () => 10,
  removeChunkByDocumentId: async () => {},
  indexAllDocuments: async () => {},
};
