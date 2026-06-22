import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Chat — POST /api/chat/query', () => {
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
        method: 'POST',
        url: '/api/chat/query',
        payload: { question: 'Combien de jours de congés ?' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should return 400 for too short question (< 3 chars)', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'ab' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for non-UUID context_id', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Congés payés?', context_id: 'not-a-uuid' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Successful query', () => {
    it('should return 200 with valid question (admin)', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Combien de jours de congés par an ?' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('answer');
      expect(body).toHaveProperty('isIgnorance');
      expect(body).toHaveProperty('queryLogId');
      expect(body).toHaveProperty('context_id');
      expect(body).toHaveProperty('responseTimeMs');
      expect(body).toHaveProperty('source');
    });

    it('should return 200 with valid question (employee)', async () => {
      const token = await generateEmployeeToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Comment déclarer un arrêt maladie ?' },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 200 with valid question (guest)', async () => {
      const token = await generateGuestToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question: 'Quels sont mes droits ?' },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Query with existing context_id', () => {
    let adminToken: string;
    let sessionId: string;

    beforeAll(async () => {
      adminToken = await generateAdminToken(jwtService, {
        sub: 'chat-context-admin-id',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: adminToken },
        payload: { question: 'Première question pour créer une session' },
      });

      sessionId = JSON.parse(res.body).context_id;
      expect(sessionId).toBeDefined();
    });

    it('should return 200 with valid context_id from previous query', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: adminToken },
        payload: {
          question: 'Suite de ma question précédente ?',
          context_id: sessionId,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.context_id).toBe(sessionId);
    });

    it('should return 404 for non-existent session UUID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: adminToken },
        payload: {
          question: 'Question sur une session inconnue',
          context_id: '00000000-0000-4000-a000-000000000000',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for another user session', async () => {
      const otherToken = await generateAdminToken(jwtService, {
        sub: 'another-user-id',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: otherToken },
        payload: {
          question: "Tenter d'accéder à la session d'un autre",
          context_id: sessionId,
        },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
