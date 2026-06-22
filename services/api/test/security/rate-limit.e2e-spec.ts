import '../helpers/rbac-guard.patch';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { createTestingApp } from '../helpers/app.factory';
import { generateAdminToken } from '../helpers/auth.factory';

/**
 * NOTE: ThrottlerModule is configured with [{ ttl: 60000, limit: 100 }] and
 * @Throttle() decorators exist on several endpoints, but ThrottlerGuard is
 * NOT applied anywhere (no @UseGuards(ThrottlerGuard) and no global guard
 * registration). Therefore rate limiting is NOT enforced.
 *
 * These tests document the current behavior (no throttling) rather than
 * the intended behavior. Once ThrottlerGuard is properly registered, all
 * tests in this file should start expecting 429 responses.
 */
describe('Rate limiting (currently NOT enforced)', () => {
  describe('POST /api/auth/login', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
      app = await createTestingApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow rapid login attempts (no throttle guard applied)', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { email: `rapid${i}@test.com`, password: 'wrong' },
        });

        expect(res.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/auth/guest/magic-link', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
      app = await createTestingApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow rapid magic link requests (no throttle guard applied)', async () => {
      for (let i = 0; i < 6; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/auth/guest/magic-link',
          payload: { email: `rapid${i}@test.com` },
        });

        expect(res.statusCode).not.toBe(429);
      }
    });
  });

  describe('POST /api/admin/reindex', () => {
    let app: NestFastifyApplication;
    let adminToken: string;

    beforeAll(async () => {
      app = await createTestingApp();
      const jwtService = app.get(JwtService);
      adminToken = await generateAdminToken(jwtService);
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow rapid reindex requests (no throttle guard applied)', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/admin/reindex',
          cookies: { access_token: adminToken },
          payload: { confirm: false },
        });

        expect(res.statusCode).not.toBe(429);
      }
    });
  });
});
