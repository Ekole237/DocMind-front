import { EMBEDDING_SERVICE } from './embedding.service';
import { EmbeddingServiceImplementation } from './embedding.service.implementation';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: EMBEDDING_SERVICE,
      useClass: EmbeddingServiceImplementation,
    },
  ],
  exports: [EMBEDDING_SERVICE],
})
export class EmbeddingModule {}
