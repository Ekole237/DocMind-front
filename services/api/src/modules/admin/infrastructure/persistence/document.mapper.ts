import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { Confidentiality } from '#admin/domain/enums/confidentiality';
import { DocumentStatus } from '#admin/domain/enums/document-status';
import type { Document as PrismaDocument } from '#prisma/client';

export class DocumentMapper {
  static toDomain(raw: PrismaDocument): DocumentEntity {
    return DocumentEntity.reconstitute(
      raw.id,
      raw.title,
      raw.driveUrl ?? null,
      raw.filePath ?? null,
      raw.mimeType ?? null,
      raw.confidentiality as Confidentiality,
      raw.status as DocumentStatus,
      raw.chunkCount,
      raw.lastModified,
      raw.createdAt,
    );
  }

  static toOrm(document: DocumentEntity): Omit<PrismaDocument, 'queryLogs'> {
    return {
      id: document.id,
      title: document.title,
      driveUrl: document.driveUrl,
      filePath: document.filePath,
      mimeType: document.mimeType,
      confidentiality: document.confidentiality as PrismaDocument['confidentiality'],
      status: document.status as PrismaDocument['status'],
      chunkCount: document.chunkCount,
      lastModified: document.lastModified,
      createdAt: document.createdAt,
    };
  }
}
