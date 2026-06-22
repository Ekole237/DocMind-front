import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, seedAdminUser } from '../helpers/db.factory';
import * as bcrypt from 'bcrypt';

describe('Auth — PUT /api/auth/profile/password', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update password for authenticated admin', async () => {
    await seedAdminUser(prisma);
    const token = await generateAdminToken(jwtService);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: 'NewStrongPass1!' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Mot de passe mis à jour avec succès');
  });

  it('should actually persist the new password in database', async () => {
    await seedAdminUser(prisma);
    const token = await generateAdminToken(jwtService);

    await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: 'NewStrongPass1!' },
    });

    const user = await (prisma as any).user.findUnique({
      where: { email: 'admin@entreprise.com' },
    });
    expect(user).not.toBeNull();
    const isMatch = await bcrypt.compare('NewStrongPass1!', user.password);
    expect(isMatch).toBe(true);
  });

  it('should return 401 without JWT', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      payload: { password: 'NewStrongPass1!' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 for employee token', async () => {
    const token = await generateEmployeeToken(jwtService);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: 'NewStrongPass1!' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 403 for guest token', async () => {
    const token = await generateGuestToken(jwtService);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: 'NewStrongPass1!' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 400 for password shorter than 6 characters', async () => {
    await seedAdminUser(prisma);
    const token = await generateAdminToken(jwtService);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: 'ab' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for empty password', async () => {
    await seedAdminUser(prisma);
    const token = await generateAdminToken(jwtService);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile/password',
      cookies: { access_token: token },
      payload: { password: '' },
    });

    expect(res.statusCode).toBe(400);
  });
});
