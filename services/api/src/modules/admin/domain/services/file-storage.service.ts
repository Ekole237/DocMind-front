export const FILE_STORAGE_SERVICE = Symbol('FileStorageService');

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface FileStorageService {
  save(file: UploadedFile): Promise<string>;
  delete(filePath: string): Promise<void>;
}
