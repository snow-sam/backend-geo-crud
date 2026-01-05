import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { BetterAuthSessionAdapter } from '../adapters/better-auth-session.adapter';
import { TypeOrmUserResolverAdapter } from '../adapters/typeorm-user-resolver.adapter';
import { DataSource } from 'typeorm';
import { TypeOrmWorkspaceResolverAdapter } from '../adapters/typeorm-workspace-resolver.adapter';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  private readonly sessionService = new BetterAuthSessionAdapter();

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ExpressRequest>();

    // 1️⃣ sessão
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    console.log('[AuthGuard] Cookie:', req.headers.cookie ? 'presente' : 'ausente');
    console.log('[AuthGuard] x-workspace-id:', req.headers['x-workspace-id'] || 'ausente');

    const session = await this.sessionService.getSessionFromRequest(
      new Request(fullUrl, {
        headers: {
          cookie: req.headers.cookie ?? '',
        },
      }),
    );

    console.log('[AuthGuard] Session:', session ? 'válida' : 'inválida');

    if (!session) throw new UnauthorizedException('Sessão inválida ou não encontrada');

    // 2️⃣ user domínio
    const user = await new TypeOrmUserResolverAdapter(
      this.dataSource,
    ).resolveByAuthUserId(session.user.id, session.user.email);

    // 3️⃣ workspace ativo (header)
    const organizationId = req.headers['x-workspace-id'] as string;

    if (!organizationId) {
      throw new BadRequestException('Workspace não informado');
    }

    const workspaceContext = await new TypeOrmWorkspaceResolverAdapter(
      this.dataSource,
    ).resolve(organizationId, user);

    // 4️⃣ injeta contexto
    req.user = user;
    (req as any).workspace = workspaceContext.workspace;
    (req as any).role = workspaceContext.role;

    return true;
  }
}
