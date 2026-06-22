import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Auth — GET /api/auth/session', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return current user for valid token via cookie', async () => {
    const token = await generateAdminToken(jwtService);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: { access_token: token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user).toBeDefined();
    expect(body.user.sub).toBe('admin-test-id');
    expect(body.user.email).toBe('admin@entreprise.com');
    expect(body.user.role).toBe('admin');
    expect(body.user.role_level).toBe(1);
  });

  it('should return current user for valid token via Bearer header', async () => {
    const token = await generateAdminToken(jwtService);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.role).toBe('admin');
  });

  it('should return employee user info', async () => {
    const token = await generateEmployeeToken(jwtService);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: { access_token: token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.role).toBe('employee');
    expect(body.user.role_level).toBe(0);
  });

  it('should return guest user info with is_guest: true', async () => {
    const token = await generateGuestToken(jwtService);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: { access_token: token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.is_guest).toBe(true);
    expect(body.user.role_level).toBe(0);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for expired token', async () => {
    const token = await generateEmployeeToken(jwtService, {
      exp: Math.floor(Date.now() / 1000) - 3600,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: { access_token: token },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for malformed token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { authorization: 'Bearer invalid.token.here' },
    });

    expect(res.statusCode).toBe(401);
  });
});
