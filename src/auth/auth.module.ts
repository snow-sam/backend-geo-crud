import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { createBetterAuth } from './better-auth.config';
import { BetterAuthSessionAdapter } from './adapters/better-auth-session.adapter';

// Token para injeção do BetterAuth
export const BETTER_AUTH_TOKEN = 'BETTER_AUTH';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: BETTER_AUTH_TOKEN,
      useFactory: () => {
        // Singleton: cria apenas uma vez
        return createBetterAuth();
      },
    },
    BetterAuthSessionAdapter,
  ],
  exports: [BETTER_AUTH_TOKEN, BetterAuthSessionAdapter],
})
export class AuthModule {}
