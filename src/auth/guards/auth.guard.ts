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
import { Tecnico } from '../../tecnicos/tecnicos.entity';
import { Workspace } from '../../workspaces/workspace.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sessionService: BetterAuthSessionAdapter,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ExpressRequest>();

    // 1️⃣ sessão
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    console.log(
      '[AuthGuard] Cookie:',
      req.headers.cookie ? 'presente' : 'ausente',
    );
    console.log(
      '[AuthGuard] x-workspace-id:',
      req.headers['x-workspace-id'] || 'ausente',
    );

    const session = await this.sessionService.getSessionFromRequest(
      new Request(fullUrl, {
        headers: {
          cookie: req.headers.cookie ?? '',
        },
      }),
    );
    console.log(req.headers.cookie);
    console.log('[AuthGuard] Session:', session ? 'válida' : 'inválida');
    console.log('[AuthGuard] Session:', session);
    if (!session)
      throw new UnauthorizedException('Sessão inválida ou não encontrada');

    // 2️⃣ user domínio
    const user = await new TypeOrmUserResolverAdapter(
      this.dataSource,
    ).resolveByAuthUserId(session.user.id, session.user.email);

    // 3️⃣ workspace ativo (header ou busca do técnico)
    let organizationId = req.headers['x-workspace-id'] as string;

    // Se não houver header, tenta buscar o workspaceId do técnico associado ao usuário
    if (!organizationId) {
      console.log(
        '[AuthGuard] Header x-workspace-id ausente, buscando workspaceId do técnico...',
      );
      const tecnicoRepo = this.dataSource.getRepository(Tecnico);
      const tecnico = await tecnicoRepo.findOne({
        where: { email: user.email },
        select: ['workspaceId'],
      });

      if (tecnico && tecnico.workspaceId) {
        // Busca o workspace pelo ID para obter o authOrganizationId
        const workspaceRepo = this.dataSource.getRepository(Workspace);
        const workspace = await workspaceRepo.findOne({
          where: { id: tecnico.workspaceId },
          select: ['authOrganizationId'],
        });

        if (workspace) {
          organizationId = workspace.authOrganizationId;
          console.log(
            '[AuthGuard] WorkspaceId encontrado do técnico:',
            organizationId,
          );
        } else {
          throw new BadRequestException('Workspace do técnico não encontrado');
        }
      } else {
        throw new BadRequestException(
          'Workspace não informado e técnico não encontrado para este usuário',
        );
      }
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
