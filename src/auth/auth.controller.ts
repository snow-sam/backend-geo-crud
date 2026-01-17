import { Controller, Req, Res, All, UseGuards, Get } from '@nestjs/common';
import { auth } from './better-auth.config';
import { Request, Response } from 'express';
import { BetterAuthExpressAdapter } from './adapters/better-auth-express.adapter';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return {
      id: req.user!.id,
      email: req.user!.email,
    };
  }

  // Rota pública sem autenticação
  @All('organization/get-full-organization')
  async getFullOrganization(@Req() req: Request, @Res() res: Response) {
    return BetterAuthExpressAdapter.handle(req, res, auth.handler);
  }

  @All('*path')
  async handler(@Req() req: Request, @Res() res: Response) {
    return BetterAuthExpressAdapter.handle(req, res, auth.handler);
  }
}
