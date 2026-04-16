import { InvalidFormat } from '#admin/domain/exceptions/invalid-format';
import { MaxFileSize } from '#admin/domain/exceptions/max-file-size';
import {
  type FileStorageService,
  type UploadedFile,
} from '#admin/domain/services/file-storage.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

@Injectable()
export class LocalFileStorageServiceImplementation implements FileStorageService {
  private readonly _uploadDir: string;

  constructor(private readonly _config: ConfigService) {
    this._uploadDir = this._config.get<string>(
      'LOCAL_STORAGE_PATH',
      join(process.cwd(), 'uploads'),
    );
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
    const fullPath = join(this._uploadDir, key);

    await fs.mkdir(join(this._uploadDir, 'documents'), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    return key;
  }

  async read(key: string): Promise<Buffer> {
    const fullPath = join(this._uploadDir, key);
    return fs.readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(join(this._uploadDir, key));
    } catch {
      // Fichier déjà supprimé ou inexistant — non critique
    }
  }
}
