import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Chat — GET /api/chat/history', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Pagination validation', () => {
    it('should return 400 for page < 1', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history?page=0',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for limit > 50', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history?limit=100',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Successful history retrieval', () => {
    it('should return 200 with empty history for new user', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'history-empty-user',
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('logs');
      expect(body).toHaveProperty('total', 0);
      expect(body).toHaveProperty('page', 1);
      expect(body).toHaveProperty('limit', 20);
      expect(Array.isArray(body.logs)).toBe(true);
    });

    it('should return 200 with history after queries (admin)', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'history-admin-user',
      });

      await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Première question admin' },
      });

      await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Deuxième question admin' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('logs');
      expect(Array.isArray(body.logs)).toBe(true);
      expect(body.logs.length).toBeGreaterThanOrEqual(2);
      expect(body.logs[0]).toHaveProperty('id');
      expect(body.logs[0]).toHaveProperty('question');
      expect(body.logs[0]).toHaveProperty('answer');
    });

    it('should return 200 for employee user', async () => {
      const token = await generateEmployeeToken(jwtService, {
        sub: 'history-emp-user',
      });

      await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Question employee' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 200 for guest user', async () => {
      const token = await generateGuestToken(jwtService, {
        sub: 'history-guest-user',
      });

      await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Question guest' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/chat/history',
        cookies: { access_token: token },
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
