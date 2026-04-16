import { InvalidFormat } from '#admin/domain/exceptions/invalid-format';
import { MaxFileSize } from '#admin/domain/exceptions/max-file-size';
import {
  type FileStorageService,
  type UploadedFile,
} from '#admin/domain/services/file-storage.service';
import { createClient } from '@supabase/supabase-js';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'text/plain': 'txt',
};

@Injectable()
export class SupabaseFileStorageServiceImplementation
  implements FileStorageService, OnModuleInit
{
  private readonly logger = new Logger(
    SupabaseFileStorageServiceImplementation.name,
  );
  private _client!: ReturnType<typeof createClient>;
  private _bucket!: string;

  constructor(private readonly _config: ConfigService) {}

  onModuleInit() {
    this._client = createClient(
      this._config.getOrThrow<string>('SUPABASE_URL'),
      this._config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this._bucket = this._config.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'documents',
    );
    this.logger.log(`Storage provider: Supabase | bucket: ${this._bucket}`);
  }

  async save(file: UploadedFile): Promise<string> {
    const ext = ALLOWED_MIME_TYPES[file.mimeType];
    if (!ext) {
      throw new InvalidFormat(
        `Type de fichier non supporté : ${file.mimeType}. Formats acceptés : PDF, DOCX, TXT.`,
      );
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new MaxFileSize(MAX_FILE_SIZE);
    }

    const key = `documents/${randomUUID()}.${ext}`;

    const { error } = await this._client.storage
      .from(this._bucket)
      .upload(key, file.buffer, { contentType: file.mimeType, upsert: false });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return key;
  }

  async read(key: string): Promise<Buffer> {
    const { data, error } = await this._client.storage
      .from(this._bucket)
      .download(key);

    if (error || !data) {
      throw new Error(
        `Supabase Storage read failed: ${error?.message ?? 'file not found'}`,
      );
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const { error } = await this._client.storage
      .from(this._bucket)
      .remove([key]);

    if (error) {
      this.logger.warn(
        `Supabase Storage delete failed for key "${key}": ${error.message}`,
      );
    }
  }
}
