import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken } from '../helpers/auth.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, seedAdminUser } from '../helpers/db.factory';

function buildMultipartBody(
  fields: Record<string, string>,
  file?: {
    fieldName: string;
    filename: string;
    contentType: string;
    content: string;
  },
): { body: string; boundary: string } {
  const boundary = '----TestBoundary' + Math.random().toString(36).slice(2);
  const parts: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(`--${boundary}`);
    parts.push(`Content-Disposition: form-data; name="${key}"`);
    parts.push('');
    parts.push(value);
  }

  if (file) {
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

describe('Admin — POST /api/admin/documents (multipart upload)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
    adminToken = await generateAdminToken(jwtService, {
      sub: 'upload-admin-id',
    });
    await seedAdminUser(prisma, {
      id: 'upload-admin-id',
      email: 'upload.admin@test.com',
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma as any).catch(() => {});
    await app.close();
  });

  it('should return 201 with valid PDF upload', async () => {
    const { body, boundary } = buildMultipartBody(
      { title: 'Test PDF', confidentiality: 'PUBLIC' },
      {
        fieldName: 'file',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 fake pdf content for testing',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
  });

  it('should return 400 without file', async () => {
    const { body, boundary } = buildMultipartBody({
      title: 'No file',
      confidentiality: 'PUBLIC',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for missing title', async () => {
    const { body, boundary } = buildMultipartBody(
      { confidentiality: 'PUBLIC' },
      {
        fieldName: 'file',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for missing confidentiality', async () => {
    const { body, boundary } = buildMultipartBody(
      { title: 'Test' },
      {
        fieldName: 'file',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid MIME type (exe)', async () => {
    const { body, boundary } = buildMultipartBody(
      { title: 'Malware', confidentiality: 'PUBLIC' },
      {
        fieldName: 'file',
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
        content: 'MZ fake exe',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 201 for valid txt upload', async () => {
    const { body, boundary } = buildMultipartBody(
      { title: 'Readme', confidentiality: 'PUBLIC' },
      {
        fieldName: 'file',
        filename: 'readme.txt',
        contentType: 'text/plain',
        content: 'Hello world',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
  });

  it('should return 400 for invalid confidentiality value', async () => {
    const { body, boundary } = buildMultipartBody(
      { title: 'Test', confidentiality: 'INVALID' },
      {
        fieldName: 'file',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        content: '%PDF-1.4 content',
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/documents',
      cookies: { access_token: adminToken },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });
});
