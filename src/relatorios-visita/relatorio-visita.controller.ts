import { Controller, UseGuards, Req } from '@nestjs/common';
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedRequest,
  ParsedBody,
} from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { RelatorioVisita } from './relatorio-visita.entity';
import { RelatorioVisitaService } from './relatorio-visita.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateRelatorioVisitaDto } from './dto/create-relatorio-visita.dto';

@Crud({
  model: { type: RelatorioVisita },
  dto: {
    create: CreateRelatorioVisitaDto,
    update: CreateRelatorioVisitaDto,
  },
  query: {
    join: {
      visita: {
        eager: false,
      },
      'visita.cliente': {
        eager: false,
      },
      'visita.tecnico': {
        eager: false,
      },
    },
  },
})
@ApiTags('relatorios-visita')
@UseGuards(AuthGuard)
@Controller('relatorios-visita')
export class RelatorioVisitaController
  implements CrudController<RelatorioVisita>
{
  constructor(public service: RelatorioVisitaService) {}

  @Override()
  async getMany(@ParsedRequest() req: CrudRequest, @Req() request: Request) {
    const workspaceId = (request as any).workspace.id;
    return this.service.getManyByWorkspace(req, workspaceId);
  }

  @Override()
  async getOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<RelatorioVisita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateRelatorioVisitaDto,
    @Req() request: Request,
  ): Promise<RelatorioVisita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<RelatorioVisita>,
    @Req() request: Request,
  ): Promise<RelatorioVisita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | RelatorioVisita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.deleteOneByWorkspace(req, workspaceId);
  }
}

