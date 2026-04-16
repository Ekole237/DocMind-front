import { InvalidFormat } from '#admin/domain/exceptions/invalid-format';
import { MaxFileSize } from '#admin/domain/exceptions/max-file-size';
import {
  type FileStorageService,
  type UploadedFile,
} from '#admin/domain/services/file-storage.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
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
export class FileStorageServiceImplementation implements FileStorageService {
  private readonly _client: S3Client;
  private readonly _bucket: string;

  constructor(private readonly _config: ConfigService) {
    const accountId = this._config.getOrThrow<string>('R2_ACCOUNT_ID');

    this._client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this._config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this._config.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });

    this._bucket = this._config.getOrThrow<string>('R2_BUCKET_NAME');
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

    await this._client.send(
      new PutObjectCommand({
        Bucket: this._bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
      }),
    );

    return key;
  }

  async read(key: string): Promise<Buffer> {
    const response = await this._client.send(
      new GetObjectCommand({ Bucket: this._bucket, Key: key }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    try {
      await this._client.send(
        new DeleteObjectCommand({ Bucket: this._bucket, Key: key }),
      );
    } catch {
      // Objet déjà supprimé ou inexistant — non critique
    }
  }
}
