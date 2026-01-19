import { Injectable, Inject } from '@nestjs/common';
import { SessionService, AuthSession } from '../ports/session.port';
import { BETTER_AUTH_TOKEN } from '../auth.module';

@Injectable()
export class BetterAuthSessionAdapter implements SessionService {
  constructor(
    @Inject(BETTER_AUTH_TOKEN) private readonly auth: ReturnType<typeof import('../better-auth.config').createBetterAuth>,
  ) {}

  async getSessionFromRequest(req: Request): Promise<AuthSession | null> {
    const cookie = req.headers.get('cookie') ?? '';

    const result = await this.auth.api.getSession({
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
