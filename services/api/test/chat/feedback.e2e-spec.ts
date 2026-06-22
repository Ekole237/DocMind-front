import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Chat — POST /api/chat/feedback', () => {
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
        url: '/api/chat/feedback',
        payload: { queryLogId: '00000000-0000-4000-a000-000000000000' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should return 400 for missing queryLogId', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for non-UUID queryLogId', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: { queryLogId: 'not-a-uuid' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for comment exceeding 500 chars', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: {
          queryLogId: '00000000-0000-4000-a000-000000000000',
          comment: 'x'.repeat(501),
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Successful feedback', () => {
    async function createQueryLog(
      sub: string,
      question: string,
    ): Promise<string> {
      const token = await generateAdminToken(jwtService, { sub });
      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: token },
        payload: { question },
      });
      return JSON.parse(res.body).queryLogId;
    }

    it('should return 201 with valid queryLogId', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'feedback-admin-id-1',
      });
      const qlId = await createQueryLog(
        'feedback-admin-id-1',
        'Question pour feedback',
      );

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: { queryLogId: qlId },
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 201 with comment', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'feedback-admin-id-2',
      });
      const qlId = await createQueryLog(
        'feedback-admin-id-2',
        'Question avec commentaire',
      );

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: {
          queryLogId: qlId,
          comment: 'Très bonne réponse, merci !',
        },
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 409 for duplicate feedback', async () => {
      const token = await generateAdminToken(jwtService, {
        sub: 'feedback-admin-id-3',
      });
      const qlId = await createQueryLog(
        'feedback-admin-id-3',
        'Question feedback dupliqué',
      );

      await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: { queryLogId: qlId },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: { queryLogId: qlId },
      });

      expect(res.statusCode).toBe(409);
    });

    it('should return 201 for employee user', async () => {
      const employeeToken = await generateEmployeeToken(jwtService, {
        sub: 'feedback-emp-id',
      });

      const queryRes = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: employeeToken },
        payload: { question: 'Question employee' },
      });
      const qlId = JSON.parse(queryRes.body).queryLogId;

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: employeeToken },
        payload: { queryLogId: qlId },
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 201 for guest user', async () => {
      const guestToken = await generateGuestToken(jwtService, {
        sub: 'feedback-guest-id',
      });

      const queryRes = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: guestToken },
        payload: { question: 'Question guest' },
      });
      const qlId = JSON.parse(queryRes.body).queryLogId;

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: guestToken },
        payload: { queryLogId: qlId },
      });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('Query log not found', () => {
    it('should return 404 for non-existent queryLogId', async () => {
      const token = await generateAdminToken(jwtService);

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: token },
        payload: {
          queryLogId: '00000000-0000-4000-a000-000000000000',
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for another user query log', async () => {
      const aliceToken = await generateAdminToken(jwtService, {
        sub: 'feedback-alice-id',
      });

      const queryRes = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        cookies: { access_token: aliceToken },
        payload: { question: 'Question Alice' },
      });
      const aliceQlId = JSON.parse(queryRes.body).queryLogId;

      const bobToken = await generateAdminToken(jwtService, {
        sub: 'feedback-bob-id',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        cookies: { access_token: bobToken },
        payload: { queryLogId: aliceQlId },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
