import { Controller, Req, Res, All, UseGuards, Get, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { BetterAuthExpressAdapter } from './adapters/better-auth-express.adapter';
import { AuthGuard } from './guards/auth.guard';
import { BETTER_AUTH_TOKEN } from './auth.module';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(BETTER_AUTH_TOKEN) private readonly auth: ReturnType<typeof import('./better-auth.config').createBetterAuth>,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return {
      id: req.user!.id,
      email: req.user!.email,
    };
  }

  @All('*path')
  async handler(@Req() req: Request, @Res() res: Response) {
    return BetterAuthExpressAdapter.handle(req, res, this.auth.handler);
  }
}
