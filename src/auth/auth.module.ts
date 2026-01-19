import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { createBetterAuth } from './better-auth.config';
import { BetterAuthSessionAdapter } from './adapters/better-auth-session.adapter';
import { AuthGuard } from './guards/auth.guard';

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
    AuthGuard,
  ],
  exports: [BETTER_AUTH_TOKEN, BetterAuthSessionAdapter, AuthGuard],
})
export class AuthModule {}
