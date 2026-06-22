import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import {
  generateAdminToken,
  generateEmployeeToken,
  generateGuestToken,
} from '../helpers/auth.factory';

describe('Auth — RBAC Guards (JwtGuard + RbacGuard)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    app = await createTestingApp();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin routes require JWT', () => {
    const adminRoutes = [
      { method: 'GET' as const, url: '/api/admin/dashboard' },
      { method: 'GET' as const, url: '/api/admin/documents' },
      { method: 'GET' as const, url: '/api/admin/feedbacks' },
      { method: 'GET' as const, url: '/api/admin/logs' },
      { method: 'GET' as const, url: '/api/admin/guests' },
    ];

    adminRoutes.forEach((route) => {
      it(`should return 401 on ${route.method} ${route.url} without token`, async () => {
        const res = await app.inject({
          method: route.method,
          url: route.url,
        });

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe('Admin routes with ADMIN token', () => {
    const adminRoutes = [
      { method: 'GET' as const, url: '/api/admin/dashboard' },
      { method: 'GET' as const, url: '/api/admin/documents' },
      { method: 'GET' as const, url: '/api/admin/feedbacks' },
      { method: 'GET' as const, url: '/api/admin/logs' },
      { method: 'GET' as const, url: '/api/admin/guests' },
    ];

    adminRoutes.forEach((route) => {
      it(`should return 200 on ${route.method} ${route.url}`, async () => {
        const token = await generateAdminToken(jwtService);

        const res = await app.inject({
          method: route.method,
          url: route.url,
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('Admin routes with EMPLOYEE token', () => {
    const adminRoutes = [
      { method: 'GET' as const, url: '/api/admin/dashboard' },
      { method: 'GET' as const, url: '/api/admin/documents' },
      { method: 'GET' as const, url: '/api/admin/feedbacks' },
      { method: 'GET' as const, url: '/api/admin/logs' },
      { method: 'GET' as const, url: '/api/admin/guests' },
    ];

    adminRoutes.forEach((route) => {
      it(`should return 403 on ${route.method} ${route.url}`, async () => {
        const token = await generateEmployeeToken(jwtService);

        const res = await app.inject({
          method: route.method,
          url: route.url,
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(403);
      });
    });
  });

  describe('Admin routes with GUEST token', () => {
    const adminRoutes = [
      { method: 'GET' as const, url: '/api/admin/dashboard' },
      { method: 'GET' as const, url: '/api/admin/documents' },
      { method: 'GET' as const, url: '/api/admin/feedbacks' },
      { method: 'GET' as const, url: '/api/admin/logs' },
      { method: 'GET' as const, url: '/api/admin/guests' },
    ];

    adminRoutes.forEach((route) => {
      it(`should return 403 on ${route.method} ${route.url}`, async () => {
        const token = await generateGuestToken(jwtService);

        const res = await app.inject({
          method: route.method,
          url: route.url,
          cookies: { access_token: token },
        });

        expect(res.statusCode).toBe(403);
      });
    });
  });

  describe('Chat routes require JWT', () => {
    const chatRoutes = [
      { method: 'POST' as const, url: '/api/chat/query' },
      { method: 'POST' as const, url: '/api/chat/feedback' },
      { method: 'GET' as const, url: '/api/chat/history' },
    ];

    chatRoutes.forEach((route) => {
      it(`should return 401 on ${route.method} ${route.url} without token`, async () => {
        const res = await app.inject({
          method: route.method,
          url: route.url,
        });

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe('Chat routes accept all authenticated users', () => {
    const chatRoutes = [
      { method: 'POST' as const, url: '/api/chat/query' },
      { method: 'POST' as const, url: '/api/chat/feedback' },
      { method: 'GET' as const, url: '/api/chat/history' },
    ];

    const tokenTypes = [
      { label: 'ADMIN', fn: () => generateAdminToken(jwtService) },
      { label: 'EMPLOYEE', fn: () => generateEmployeeToken(jwtService) },
      { label: 'GUEST', fn: () => generateGuestToken(jwtService) },
    ];

    tokenTypes.forEach(({ label, fn }) => {
      chatRoutes.forEach((route) => {
        it(`should allow ${label} on ${route.method} ${route.url}`, async () => {
          const token = await fn();

          const res = await app.inject({
            method: route.method,
            url: route.url,
            cookies: { access_token: token },
          });

          expect(res.statusCode).not.toBe(401);
        });
      });
    });
  });
});
