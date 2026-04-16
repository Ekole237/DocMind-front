import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { DocumentStatus } from '#admin/domain/enums/document-status';
import { DocumentNotFound } from '#admin/domain/exceptions/document-not-found';
import {
  ClassifyDocument,
  CreateDocument,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import { DocumentMapper } from '#admin/infrastructure/persistence/document.mapper';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentRepositoryImplementation implements DocumentRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async listDocuments(): Promise<DocumentEntity[]> {
    const documents = await this._prismaService.document.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((d) => DocumentMapper.toDomain(d));
  }

  async createDocument(dto: CreateDocument): Promise<DocumentEntity> {
    const entity = DocumentEntity.create(
      dto.title,
      dto.confidentiality,
      dto.driveUrl ?? null,
      dto.filePath ?? null,
      dto.mimeType ?? null,
    );

    await this._prismaService.document.create({
      data: DocumentMapper.toOrm(entity),
    });

    return entity;
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const raw = await this._prismaService.document.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return DocumentMapper.toDomain(raw);
  }

  async classifyDocument(
    id: string,
    dto: ClassifyDocument,
  ): Promise<DocumentEntity> {
    const raw = await this._prismaService.document.update({
      where: { id },
      data: { confidentiality: dto.confidentiality },
    });

    return DocumentMapper.toDomain(raw);
  }

  async disableDocument(id: string): Promise<DocumentEntity> {
    const raw = await this._prismaService.document.update({
      where: { id },
      data: { status: DocumentStatus.DISABLED },
    });

    return DocumentMapper.toDomain(raw);
  }

  async enableDocument(id: string): Promise<DocumentEntity> {
    const raw = await this._prismaService.document.update({
      where: { id },
      data: { status: DocumentStatus.INDEXED },
    });

    return DocumentMapper.toDomain(raw);
  }

  async deleteDocument(id: string): Promise<void> {
    const exists = await this._prismaService.document.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new DocumentNotFound();
    }

    await this._prismaService.document.delete({ where: { id } });
  }

  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<DocumentEntity> {
    const raw = await this._prismaService.document.update({
      where: { id },
      data: { status },
    });

    return DocumentMapper.toDomain(raw);
  }

  async updateChunkCount(
    id: string,
    chunkCount: number,
  ): Promise<DocumentEntity> {
    const raw = await this._prismaService.document.update({
      where: { id },
      data: { chunkCount, lastModified: new Date() },
    });

    return DocumentMapper.toDomain(raw);
  }

  async countByStatus(status: DocumentStatus): Promise<number> {
    return this._prismaService.document.count({ where: { status } });
  }
}
