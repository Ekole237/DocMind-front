import { randomUUID } from 'crypto';
import { Confidentiality } from '../enums/confidentiality';
import { DocumentStatus } from '../enums/document-status';

export class DocumentEntity {
  private constructor(
    private readonly _id: string,
    private readonly _title: string,
    private readonly _driveUrl: string | null,
    private readonly _filePath: string | null,
    private readonly _mimeType: string | null,
    private readonly _confidentiality: Confidentiality,
    private readonly _status: DocumentStatus,
    private readonly _chunkCount: number,
    private readonly _lastModified: Date,
    private readonly _createdAt: Date,
  ) {}

  static create(
    title: string,
    confidentiality: Confidentiality,
    driveUrl: string | null = null,
    filePath: string | null = null,
    mimeType: string | null = null,
  ): DocumentEntity {
    return new DocumentEntity(
      randomUUID(),
      title,
      driveUrl,
      filePath,
      mimeType,
      confidentiality,
      DocumentStatus.PENDING,
      0,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    title: string,
    driveUrl: string | null,
    filePath: string | null,
    mimeType: string | null,
    confidentiality: Confidentiality,
    status: DocumentStatus,
    chunkCount: number,
    lastModified: Date,
    createdAt: Date,
  ): DocumentEntity {
    return new DocumentEntity(
      id,
      title,
      driveUrl,
      filePath,
      mimeType,
      confidentiality,
      status,
      chunkCount,
      lastModified,
      createdAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get driveUrl(): string | null {
    return this._driveUrl;
  }

  get filePath(): string | null {
    return this._filePath;
  }

  get mimeType(): string | null {
    return this._mimeType;
  }

  get confidentiality(): Confidentiality {
    return this._confidentiality;
  }

  get status(): DocumentStatus {
    return this._status;
  }

  get chunkCount(): number {
    return this._chunkCount;
  }

  get lastModified(): Date {
    return this._lastModified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
