import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken } from '../helpers/auth.factory';

describe('Security — JWT, input validation, CORS, headers', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT tampering', () => {
    it('should return 401 for expired JWT (exp in past)', async () => {
      const token = jwtService.sign({
        sub: 'any',
        role: 'admin' as any,
        role_level: 1,
        iat: 1000000000,
        exp: 1000000000,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for JWT signed with wrong secret', async () => {
      const badJwt = new JwtService({ secret: 'wrong-secret-not-matching' });
      const token = await badJwt.signAsync({
        sub: 'any',
        role: 'admin' as any,
        role_level: 1,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for malformed JWT string', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        cookies: { access_token: 'not.a.jwt' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for JWT with alg:none', async () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ sub: 'any', role: 'admin', role_level: 1 }),
      ).toString('base64url');
      const token = `${header}.${payload}.`;

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for empty token cookie', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        cookies: { access_token: '' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Input injection attempts', () => {
    it('should handle SQL injection-like question without error', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: "'; DROP TABLE users; --",
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should reject question > 1000 chars', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'A'.repeat(1001),
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should accept question at exactly 1000 chars', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'A'.repeat(1000),
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should reject extra fields via forbidNonWhitelisted', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'Test query',
          maliciousField: 'should be rejected',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should handle XSS-like question without error', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: '<script>alert("xss")</script>',
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should handle unicode and special characters', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'Québec français 汉语 español عربي',
        },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('CORS and security headers', () => {
    it('should include X-Frame-Options: DENY', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
      });

      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should include X-Content-Type-Options: nosniff', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
      });

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should not expose X-Powered-By header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
      });

      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Bearer token auth', () => {
    it('should accept Bearer token as alternative to cookie', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should reject invalid Bearer token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: 'Bearer invalid-token-here' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject empty Bearer token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: 'Bearer ' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject wrong auth scheme (Basic instead of Bearer)', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: `Basic ${token}` },
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
