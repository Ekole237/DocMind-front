import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken } from '../helpers/auth.factory';

describe('Robustness — error handling, malformed input, edge cases', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Malformed request body', () => {
    it('should return 400 for invalid JSON body', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        headers: { 'content-type': 'application/json' },
        payload: '{invalid json',
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for sending array instead of object', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: ['question', 'test'],
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for sending number instead of object', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { invalid: 42 },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 415 for XML content type', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        headers: { 'content-type': 'application/xml' },
        payload: '<root><question>test</question></root>',
      });

      expect(res.statusCode).toBe(415);
    });
  });

  describe('Wrong HTTP methods', () => {
    it('should return 404 for GET on POST-only /api/chat/query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/query',
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for PUT on existing route /api/chat/query', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/chat/query',
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for DELETE on /api/chat/query', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/chat/query',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Non-existent routes', () => {
    it('should return 404 for unknown path', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/nonexistent',
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for deeply nested unknown path', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/a/b/c/d/e/f',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Query parameter edge cases', () => {
    it('should reject non-numeric page', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history?page=abc',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject non-numeric limit', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history?limit=abc',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple concurrent chat queries', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'concurrent-user',
      });

      const requests = Array.from({ length: 10 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/api/chat/query',
          cookies: { access_token: token },
          payload: { question: `Concurrent request ${i}` },
        }),
      );

      const results = await Promise.all(requests);
      results.forEach((res) => {
        expect(res.statusCode).toBe(200);
      });
    });

    it('should handle multiple concurrent login attempts', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: `concurrent${i}@test.com`,
            password: 'wrong',
          },
        }),
      );

      const results = await Promise.all(requests);
      results.forEach((res) => {
        expect(res.statusCode).toBe(401);
      });
    });

    it('should handle concurrent auth and chat requests', async () => {
      const authReq = app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'admin@entreprise.com', password: 'StrongPass1!' },
      });

      const sessionReq = authReq.then(() =>
        app.inject({ method: 'GET', url: '/api/auth/session' }),
      );

      const [authRes, sessionRes] = await Promise.all([authReq, sessionReq]);
      expect(authRes.statusCode).toBe(401);
      expect(sessionRes.statusCode).toBe(401);
    });
  });

  describe('Boundary values for login', () => {
    it('should accept minimum valid email length', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'a@b.co', password: 'Valid123!' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject extremely long email (>254 chars)', async () => {
      const local = 'a'.repeat(64);
      const domain = 'b'.repeat(189);
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: `${local}@${domain}.com`,
          password: 'Valid123!',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject email with multiple @ symbols', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@test@test.com', password: 'Valid123!' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Unicode and encoding edge cases', () => {
    it('should handle zero-width characters in question', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'Test\u200B\u200C\u200D\uFEFFquestion',
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should handle emoji in question', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {
          question: 'Question with emoji 🔥 test',
        },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should handle very long question at limit (1000 chars)', async () => {
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
  });
});
