import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestingApp } from '../helpers/app.factory';

describe('Auth — POST /api/auth/logout', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should clear the access_token cookie and return loggedOut', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.loggedOut).toBe(true);

    const cookies = res.cookies;
    const accessCookie = cookies.find((c) => c.name === 'access_token');
    expect(accessCookie).toBeDefined();

    if (accessCookie) {
      expect(accessCookie.value).toBe('');
      expect(accessCookie.expires).toBeDefined();
      if (accessCookie.expires) {
        const expires = new Date(accessCookie.expires);
        expect(expires.getTime()).toBeLessThan(Date.now());
      }
    }
  });

  it('should return 200 even without a valid session (idempotent)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(res.statusCode).toBe(200);
  });
});
