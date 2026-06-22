import { createTestingApp } from '../test/helpers/app.factory';

describe('RBAC debug', () => {
  it('should check RbacGuard resolution', async () => {
    const app = await createTestingApp();

    try {
      const guard = (app as any).get('RbacGuard');
      console.log('By string token:', guard?.constructor?.name);
    } catch (e) {
      console.log('Error by string:', e.message);
    }

    try {
      const guards = (app as any).get('RbacGuard', { strict: false });
      console.log('By string (strict:false):', guards?.constructor?.name);
    } catch (e) {
      console.log('Error:', e.message);
    }

    await app.close();
  });
});
