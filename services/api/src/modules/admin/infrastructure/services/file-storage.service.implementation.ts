import { InvalidFormat } from '#admin/domain/exceptions/invalid-format';
import { MaxFileSize } from '#admin/domain/exceptions/max-file-size';
import {
  type FileStorageService,
  type UploadedFile,
} from '#admin/domain/services/file-storage.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

@Injectable()
export class FileStorageServiceImplementation implements FileStorageService {
  private readonly _uploadDir: string;

  constructor(private readonly _config: ConfigService) {
    this._uploadDir = path.resolve(
      this._config.get<string>('UPLOAD_DIR', 'uploads'),
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

    await fs.mkdir(this._uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(this._uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Fichier déjà supprimé ou inexistant — non critique
    }
  }
}
