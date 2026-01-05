import { Controller, UseGuards, Req } from '@nestjs/common';
import { Crud, CrudController, CrudRequest, Override, ParsedRequest, ParsedBody } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Visita } from './visitas.entity';
import { VisitasService } from './visitas.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Crud({
  model: { type: Visita },
  query: {
    join: {
      cliente: {
        eager: true,
        allow: ['nome', 'endereco'],
      },
      tecnico: {
        eager: true,
        allow: ['nome', 'endereco'],
      },
    },
    sort: [
      {
        field: "dataAgendamento",
        order: "ASC",
      },
    ],
  },
  
})
@ApiTags('visitas')
@UseGuards(AuthGuard)
@Controller('visitas')
export class VisitasController implements CrudController<Visita> {
  constructor(public service: VisitasService) {}

  @Override()
  async getMany(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ) {
    const workspaceId = (request as any).workspace.id;
    return this.service.getManyByWorkspace(req, workspaceId);
  }

  @Override()
  async getOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<Visita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<Visita>,
    @Req() request: Request,
  ): Promise<Visita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<Visita>,
    @Req() request: Request,
  ): Promise<Visita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | Visita> {
    const workspaceId = (request as any).workspace.id;
    return this.service.deleteOneByWorkspace(req, workspaceId);
  }
}
