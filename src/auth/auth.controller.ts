import { Controller, Req, Res, All, UseGuards, Get, Query } from '@nestjs/common';
import { auth } from './better-auth.config';
import { Request, Response } from 'express';
import { BetterAuthExpressAdapter } from './adapters/better-auth-express.adapter';
import { AuthGuard } from './guards/auth.guard';
import { Pool } from 'pg';

@Controller('auth')
export class AuthController {
  private readonly pool: Pool;

  constructor() {
    // Cria um pool separado com as mesmas configurações do better-auth
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: false,
    });
  }

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
      // Descobre o nome correto da tabela de organização
      const tablesResult = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name LIKE '%organization%'
        ORDER BY table_name
      `);

      if (tablesResult.rows.length === 0) {
        return res.status(500).json({ error: 'Tabela de organização não encontrada no schema auth' });
      }

      const orgTableName = tablesResult.rows[0].table_name;
      console.log('Usando tabela:', orgTableName);

      // Busca a organização
      const organizationResult = await this.pool.query(
        `SELECT * FROM auth."${orgTableName}" WHERE slug = $1 LIMIT 1`,
        [organizationSlug]
      );

      if (organizationResult.rows.length === 0) {
        return res.status(404).json({ error: 'Organização não encontrada' });
      }

      const organization = organizationResult.rows[0];

      // Descobre o nome da tabela de membros
      const memberTablesResult = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name LIKE '%member%'
        AND table_name LIKE '%organization%'
        ORDER BY table_name
      `);

      let members = [];
      if (memberTablesResult.rows.length > 0) {
        const memberTableName = memberTablesResult.rows[0].table_name;
        console.log('Usando tabela de membros:', memberTableName);

        try {
          const membersResult = await this.pool.query(
            `SELECT om.*, u.email, u.name as user_name 
             FROM auth."${memberTableName}" om
             JOIN auth."user" u ON om.user_id = u.id
             WHERE om.organization_id = $1`,
            [organization.id]
          );
          members = membersResult.rows;
        } catch (e) {
          console.warn('Erro ao buscar membros:', e);
        }
      }

      return res.json({
        ...organization,
        members,
      });
    } catch (error) {
      console.error('Erro ao buscar organização:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar organização',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  @All('*path')
  async handler(@Req() req: Request, @Res() res: Response) {
    return BetterAuthExpressAdapter.handle(req, res, auth.handler);
  }
}
