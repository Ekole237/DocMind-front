import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmbeddingModule } from './core/embedding/embedding.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { QdrantModule } from './qdrant/qdrant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EmbeddingModule,
    PrismaModule,
    QdrantModule,
    AuthModule,
    ChatModule,
    AdminModule,
  ],
})
export class AppModule {}
