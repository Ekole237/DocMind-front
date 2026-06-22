import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestingApp } from '../helpers/app.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  cleanDatabase,
  seedGuestToken,
  seedMagicLink,
} from '../helpers/db.factory';
// Import types from generated Prisma client
// import { GuestToken, MagicLink } from '@prisma/client';

describe('Auth — Guest activation & magic link', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/auth/guest/activate (first login via QR code)', () => {
    it('should activate valid guest token and return JWT', async () => {
      await seedGuestToken(prisma);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=11111111-1111-4111-a111-111111111111',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user).toBeDefined();
      expect(body.user.is_guest).toBe(true);
      expect(body.user.role).toBe('employee');
      expect(body.user.role_level).toBe(0);

      const cookies = res.cookies;
      const accessCookie = cookies.find((c) => c.name === 'access_token');
      expect(accessCookie).toBeDefined();
      expect(accessCookie!.value).toBeTruthy();
    });

    it('should mark guest token as used after activation', async () => {
      await seedGuestToken(prisma);

      await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=11111111-1111-4111-a111-111111111111',
      });

      const token = await prisma.guestToken.findUnique({
        where: { token: '11111111-1111-4111-a111-111111111111' },
      });
      expect(token?.used).toBe(true);
    });

    it('should return 401 for already used token', async () => {
      await seedGuestToken(prisma, { used: true });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=11111111-1111-4111-a111-111111111111',
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('TOKEN_ALREADY_USED');
    });

    it('should return 401 for expired token', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      await seedGuestToken(prisma, { expiresAt: past });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=11111111-1111-4111-a111-111111111111',
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('GUEST_ACCESS_EXPIRED');
    });

    it('should return 404 for unknown token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for non-UUID token format', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/activate?token=invalid-token',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/guest/magic-link (subsequent login request)', () => {
    it('should return success message for recognized email', async () => {
      await seedGuestToken(prisma, { used: true });

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'guest@gmail.com' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('Si cet email est associé');
    });

    it('should return same message for unrecognized email (obscurity)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'unknown@gmail.com' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('Si cet email est associé');
    });

    it('should create a magic link in database for valid email', async () => {
      await seedGuestToken(prisma, { used: true });

      await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'guest@gmail.com' },
      });

      const magicLink = await prisma.magicLink.findFirst({
        where: { guestEmail: 'guest@gmail.com' },
      });
      expect(magicLink).not.toBeNull();
      expect(magicLink!.used).toBe(false);
    });

    it('should NOT create magic link for unrecognized email', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'unknown@gmail.com' },
      });

      const count = await prisma.magicLink.count();
      expect(count).toBe(0);
    });

    it('should NOT create magic link if guest token not yet used', async () => {
      await seedGuestToken(prisma, { used: false });

      await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'guest@gmail.com' },
      });

      const count = await prisma.magicLink.count();
      expect(count).toBe(0);
    });

    it('should return 400 for invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/guest/magic-link',
        payload: { email: 'not-an-email' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/auth/guest/magic-link/activate (magic link click)', () => {
    it('should activate valid magic link and return JWT', async () => {
      await seedGuestToken(prisma, { used: true });
      await seedMagicLink(prisma);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/magic-link/activate?token=22222222-2222-4222-a222-222222222222',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user).toBeDefined();
      expect(body.user.is_guest).toBe(true);

      const cookies = res.cookies;
      const accessCookie = cookies.find((c) => c.name === 'access_token');
      expect(accessCookie).toBeDefined();
    });

    it('should mark magic link as used', async () => {
      await seedGuestToken(prisma, { used: true });
      await seedMagicLink(prisma);

      await app.inject({
        method: 'GET',
        url: '/api/auth/guest/magic-link/activate?token=22222222-2222-4222-a222-222222222222',
      });

      const link = await prisma.magicLink.findUnique({
        where: { token: '22222222-2222-4222-a222-222222222222' },
      });
      expect(link?.used).toBe(true);
    });

    it('should return 401 for already used magic link', async () => {
      await seedGuestToken(prisma, { used: true });
      await seedMagicLink(prisma, { used: true });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/magic-link/activate?token=22222222-2222-4222-a222-222222222222',
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('TOKEN_ALREADY_USED');
    });

    it('should return 401 for expired magic link', async () => {
      const past = new Date();
      past.setMinutes(past.getMinutes() - 30);
      await seedGuestToken(prisma, { used: true });
      await seedMagicLink(prisma, { expiresAt: past });

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/magic-link/activate?token=22222222-2222-4222-a222-222222222222',
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 404 for unknown magic link token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/guest/magic-link/activate?token=aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
