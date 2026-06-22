import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestingApp } from '../helpers/app.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  cleanDatabase,
  seedAdminUser,
  seedEmployeeUser,
} from '../helpers/db.factory';

describe('Auth — POST /api/auth/login', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should login ADMIN successfully with valid credentials', async () => {
    await seedAdminUser(prisma);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@entreprise.com', password: 'StrongPass1!' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe('admin');
    expect(body.user.email).toBe('admin@entreprise.com');

    const cookies = res.cookies;
    const accessCookie = cookies.find((c) => c.name === 'access_token');
    expect(accessCookie).toBeDefined();
    expect(accessCookie!.value).toBeTruthy();
    expect(accessCookie!.httpOnly).toBe(true);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'unknown@entreprise.com', password: 'StrongPass1!' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 for wrong password', async () => {
    await seedAdminUser(prisma);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@entreprise.com', password: 'WrongPass1!' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 for user without password (ZOHO-only)', async () => {
    await seedEmployeeUser(prisma);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'employee@entreprise.com', password: 'StrongPass1!' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when honeypot _hp is filled', async () => {
    await seedAdminUser(prisma);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@entreprise.com',
        password: 'StrongPass1!',
        _hp: 'bot-value',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'not-an-email', password: 'StrongPass1!' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for empty password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@entreprise.com', password: '' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return user role from database, not from email domain', async () => {
    await seedAdminUser(prisma, {
      email: 'someone@external.com',
      password: 'Pass1234!',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'someone@external.com',
        password: 'Pass1234!',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.role).toBe('admin');
  });

  it('should return the JWT payload in user object', async () => {
    await seedAdminUser(prisma);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@entreprise.com', password: 'StrongPass1!' },
    });

    const body = JSON.parse(res.body);
    expect(body.user).toMatchObject({
      sub: 'admin-test-id',
      email: 'admin@entreprise.com',
      role: 'admin',
      role_level: 1,
    });
  });
});
