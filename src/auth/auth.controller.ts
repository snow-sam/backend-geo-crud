import { Controller, Req, Res, All, UseGuards, Get, Query } from '@nestjs/common';
import { auth } from './better-auth.config';
import { Request, Response } from 'express';
import { BetterAuthExpressAdapter } from './adapters/better-auth-express.adapter';
import { AuthGuard } from './guards/auth.guard';
import { DataSource } from 'typeorm';

@Controller('auth')
export class AuthController {
  constructor(private readonly dataSource: DataSource) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return {
      id: req.user!.id,
      email: req.user!.email,
    };
  }

  // Rota pública sem autenticação - busca diretamente do banco
  @Get('organization/get-full-organization')
  async getFullOrganization(@Query('organizationSlug') organizationSlug: string, @Res() res: Response) {
    if (!organizationSlug) {
      return res.status(400).json({ error: 'organizationSlug é obrigatório' });
    }

    try {
      // Busca a organização diretamente do banco do better-auth usando DataSource
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const organizationResult = await queryRunner.query(
        `SELECT * FROM auth.organization WHERE slug = $1`,
        [organizationSlug]
      );

      if (organizationResult.length === 0) {
        await queryRunner.release();
        return res.status(404).json({ error: 'Organização não encontrada' });
      }

      const organization = organizationResult[0];

      // Busca os membros da organização
      const membersResult = await queryRunner.query(
        `SELECT om.*, u.email, u.name as user_name 
         FROM auth.organization_member om
         JOIN auth.user u ON om.user_id = u.id
         WHERE om.organization_id = $1`,
        [organization.id]
      );

      await queryRunner.release();

      return res.json({
        ...organization,
        members: membersResult,
      });
    } catch (error) {
      console.error('Erro ao buscar organização:', error);
      return res.status(500).json({ error: 'Erro ao buscar organização' });
    }
  }

  @All('*path')
  async handler(@Req() req: Request, @Res() res: Response) {
    return BetterAuthExpressAdapter.handle(req, res, auth.handler);
  }
}
