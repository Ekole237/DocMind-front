import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Chat — GET /api/chat/sessions and /sessions/:id/logs', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/chat/sessions', () => {
    describe('Authentication', () => {
      it('should return 401 without token', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/chat/sessions',
        });

        expect(res.statusCode).toBe(401);
      });
    });

    describe('Successful retrieval', () => {
      it('should return 200 with empty sessions for new user', async () => {
        const token = await generateAdminToken(jwtService, {
          sub: 'sessions-empty-user',
        });

        const res = await app.inject({
          method: 'GET',
          url: '/api/chat/sessions',
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(Array.isArray(body)).toBe(true);
      });

      it('should return 200 with sessions after queries (admin)', async () => {
        const token = await generateAdminToken(jwtService, {
          sub: 'sessions-admin-user',
        });

        await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          cookies: { access_token: token },
          payload: { question: 'Première question' },
        });

        await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          cookies: { access_token: token },
          payload: { question: 'Deuxième question' },
        });

        const res = await app.inject({
          method: 'GET',
          url: '/api/chat/sessions',
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(1);
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('title');
      });

      it('should return 200 for employee user', async () => {
        const token = await generateEmployeeToken(jwtService, {
          sub: 'sessions-emp-user',
        });

        await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          cookies: { access_token: token },
          payload: { question: 'Question employee' },
        });

        const res = await app.inject({
          method: 'GET',
          url: '/api/chat/sessions',
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(200);
      });

      it('should return 200 for guest user', async () => {
        const token = await generateGuestToken(jwtService, {
          sub: 'sessions-guest-user',
        });

        await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          cookies: { access_token: token },
          payload: { question: 'Question guest' },
        });

        const res = await app.inject({
          method: 'GET',
          url: '/api/chat/sessions',
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('GET /api/chat/sessions/:id/logs', () => {
    let adminToken: string;
    let sessionId: string;

    beforeAll(async () => {
      adminToken = await generateAdminToken(jwtService, {
        sub: 'sessions-logs-admin',
      });

      const firstRes = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: adminToken },
        payload: { question: 'Première question' },
      });
      sessionId = JSON.parse(firstRes.body).context_id;

      await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: adminToken },
        payload: {
          question: 'Deuxième question',
          context_id: sessionId,
        },
      });
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/chat/sessions/${sessionId}/logs`,
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 200 with logs for own session', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/chat/sessions/${sessionId}/logs`,
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('content');
      expect(body[0]).toHaveProperty('role');
    });

    it('should return 404 for another user session', async () => {
      const otherToken = await generateAdminToken(jwtService, {
        sub: 'sessions-logs-other',
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/chat/sessions/${sessionId}/logs`,
        cookies: { access_token: otherToken },
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for non-existent session UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/sessions/00000000-0000-4000-a000-000000000000/logs',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
