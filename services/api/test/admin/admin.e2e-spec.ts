import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken } from '../helpers/auth.factory';
import {
  seedAdminUser,
  seedDocument,
  seedGuestToken,
  seedQueryLog,
  seedFeedback,
  seedChatSession,
  cleanDatabase,
} from '../helpers/db.factory';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Admin — Endpoints', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
    adminToken = await generateAdminToken(jwtService, { sub: 'admin-e2e-id' });
    await seedAdminUser(prisma, {
      id: 'admin-e2e-id',
      email: 'admin.e2e@test.com',
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma as any).catch(() => {});
    await app.close();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return 200 with dashboard stats', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('documentsIndexed');
      expect(body).toHaveProperty('documentsPending');
      expect(body).toHaveProperty('feedbacksPending');
      expect(body).toHaveProperty('queriesThisMonth');
    });
  });

  describe('GET /api/admin/documents', () => {
    beforeAll(async () => {
      await seedDocument(prisma, {
        id: 'admin-doc-1',
        title: 'Doc Test 1',
      });
      await seedDocument(prisma, {
        id: 'admin-doc-2',
        title: 'Doc Test 2',
        status: 'INDEXED',
        chunkCount: 15,
      });
    });

    it('should return 200 with document list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/documents',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body[0]).toHaveProperty('_id');
      expect(body[0]).toHaveProperty('_title');
      expect(body[0]).toHaveProperty('_status');
    });
  });

  describe('GET /api/admin/feedbacks', () => {
    beforeAll(async () => {
      await seedAdminUser(prisma, {
        id: 'admin-fb-user',
        email: 'feedback.user@test.com',
      });
      await seedDocument(prisma, { id: 'admin-fb-doc' });
      await seedChatSession(prisma, {
        id: 'admin-fb-session',
        userIdHash: 'hash-admin-ql-1',
      });
      await seedQueryLog(prisma, {
        id: 'admin-ql-1',
        userIdHash: 'hash-admin-ql-1',
        chatSessionId: 'admin-fb-session',
        sourceDocId: 'admin-fb-doc',
        question: 'Question avec feedback',
      });
      await seedFeedback(prisma, {
        id: 'admin-fb-1',
        queryLogId: 'admin-ql-1',
        comment: 'Feedback test',
      });
    });

    it('should return 200 with paginated feedbacks', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/feedbacks',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('feedbacks');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.feedbacks)).toBe(true);
    });
  });

  describe('GET /api/admin/logs', () => {
    beforeAll(async () => {
      await seedDocument(prisma, { id: 'admin-logs-doc' });
      await seedChatSession(prisma, {
        id: 'admin-logs-session',
        userIdHash: 'hash-admin-logs',
      });
      await seedQueryLog(prisma, {
        id: 'admin-ql-2',
        userIdHash: 'hash-admin-logs',
        chatSessionId: 'admin-logs-session',
        sourceDocId: 'admin-logs-doc',
        question: 'Question dans les logs',
        answer: 'Réponse dans les logs',
        role: 'ADMIN',
      });
    });

    it('should return 200 with query logs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/logs',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0]).toHaveProperty('_id');
      expect(body[0]).toHaveProperty('_question');
      expect(body[0]).toHaveProperty('_answer');
    });

    it('should return 400 for limit > 100', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/logs?limit=200',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/admin/guests', () => {
    beforeAll(async () => {
      await seedGuestToken(prisma, {
        id: 'admin-guest-1',
        token: '33333333-3333-4333-b333-333333333333',
        firstName: 'Pierre',
        lastName: 'Test',
        email: 'pierre@test.com',
        createdBy: 'admin-e2e-id',
      });
    });

    it('should return 200 with paginated guest tokens', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/guests',
        cookies: { access_token: adminToken },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('tokens');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.tokens)).toBe(true);
    });
  });

  describe('POST /api/admin/guests', () => {
    it('should return 201 with created guest token', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 30);

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/guests',
        cookies: { access_token: adminToken },
        payload: {
          firstName: 'Nouveau',
          lastName: 'Invité',
          email: 'nouveau@invite.com',
          expiresAt: future.toISOString(),
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('activateUrl');
    });
  });

  describe('POST /api/admin/reindex', () => {
    it('should return 202 with cancelled when confirm is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/reindex',
        cookies: { access_token: adminToken },
        payload: {},
      });

      expect(res.statusCode).toBe(202);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('status', 'cancelled');
    });

    it('should return 202 with confirm:true', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/reindex',
        cookies: { access_token: adminToken },
        payload: { confirm: true },
      });

      expect(res.statusCode).toBe(202);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('status', 'indexation_started');
    });
  });
});
