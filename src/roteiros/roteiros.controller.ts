import { Controller, UseGuards, Req } from '@nestjs/common';
import { Crud, CrudController, CrudRequest, Override, ParsedRequest, ParsedBody } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Roteiro } from './roteiros.entity';
import { RoteirosService } from './roteiros.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Crud({
  model: { type: Roteiro },
  query: {
    join: {
      tecnico: {
        eager: false,
      },
      visitas: {
        eager: false,
      },
      'visitas.cliente': {
        eager: false,
      },
      'visitas.tecnico': {
        eager: false,
      },
    },
  },
})
@ApiTags('roteiros')
@UseGuards(AuthGuard)
@Controller('roteiros')
export class RoteirosController implements CrudController<Roteiro> {
  constructor(public service: RoteirosService) {}

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
  ): Promise<Roteiro> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<Roteiro>,
    @Req() request: Request,
  ): Promise<Roteiro> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<Roteiro>,
    @Req() request: Request,
  ): Promise<Roteiro> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | Roteiro> {
    const workspaceId = (request as any).workspace.id;
    return this.service.deleteOneByWorkspace(req, workspaceId);
  }
}
