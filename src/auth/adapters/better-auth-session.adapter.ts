import { auth } from '../better-auth.config';
import { SessionService, AuthSession } from '../ports/session.port';

export class BetterAuthSessionAdapter implements SessionService {
  async getSessionFromRequest(req: Request): Promise<AuthSession | null> {
    const cookie = req.headers.get('cookie') ?? '';

    const result = await auth.api.getSession({
      headers: {
        cookie,
      },
    });
    console.log('result', result);
    if (!result?.session || !result?.user) {
      return null;
    }

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    };
  }
}
