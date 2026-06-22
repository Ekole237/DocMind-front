import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken, generateEmployeeToken } from '../helpers/auth.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, seedAdminUser, seedEmployeeUser } from '../helpers/db.factory';

function buildMultipartBody(
  files: { fieldName: string; filename: string; contentType: string; content: string }[],
): { body: string; boundary: string } {
  const boundary = '----TestBoundary' + Math.random().toString(36).slice(2);
  const parts: string[] = [];

  for (const file of files) {
    parts.push(`--${boundary}`);
    parts.push(
      `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"`,
    );
    parts.push(`Content-Type: ${file.contentType}`);
    parts.push('');
    parts.push(file.content);
  }

  parts.push(`--${boundary}--`);

  return { body: parts.join('\r\n'), boundary };
}

describe('Admin — POST /api/admin/documents/batch (multipart batch upload)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
    adminToken = await generateAdminToken(jwtService, {
      sub: 'batch-admin-id',
    });
    employeeToken = await generateEmployeeToken(jwtService, {
      sub: 'batch-employee-id',
    });
    await seedAdminUser(prisma, {
      id: 'batch-admin-id',
      email: 'batch.admin@test.com',
    });
    await seedEmployeeUser(prisma, {
      id: 'batch-employee-id',
      email: 'batch.employee@test.com',
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma).catch(() => {});
    await app.close();
  });

  it('should return 201 with multiple valid files', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'doc1.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 fake content',
      },
      {
        fieldName: 'files',
        filename: 'doc2.txt',
        contentType: 'text/plain',
        content: 'Hello from text file',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    const result = JSON.parse(res.payload);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]._title).toBe('doc1');
    expect(result[1]._title).toBe('doc2');
  });

  it('should return 400 when no files are provided', async () => {
    const { body, boundary } = buildMultipartBody([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when confidentiality is missing', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid file type in batch', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'valid.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
      {
        fieldName: 'files',
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
        content: 'MZ fake exe',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid confidentiality value', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=INVALID',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when exceeding max 20 files', async () => {
    const manyFiles = Array.from({ length: 21 }, (_, i) => ({
      fieldName: 'files',
      filename: `doc${i + 1}.txt`,
      contentType: 'text/plain',
      content: `content ${i + 1}`,
    }));

    const { body, boundary } = buildMultipartBody(manyFiles);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 without authentication', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 for non-admin user', async () => {
    const { body, boundary } = buildMultipartBody([
      {
        fieldName: 'files',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents/batch?confidentiality=PUBLIC',
      cookies: { access_token: employeeToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(403);
  });
});
