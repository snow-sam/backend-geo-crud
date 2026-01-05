import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Crud, CrudController, CrudRequest, Override, ParsedRequest, ParsedBody } from '@dataui/crud';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

import { Chamado } from './chamados.entity';
import { ChamadosService } from './chamados.service';
import { CreateChamadoDto } from './dtos/create-chamado.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Crud({
  model: { type: Chamado }
})
@ApiTags('chamados')
@UseGuards(AuthGuard)
@Controller('chamados')
export class ChamadosController implements CrudController<Chamado> {
  constructor(public service: ChamadosService) {}

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
  ): Promise<Chamado> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateChamadoDto,
    @Req() request: Request,
  ): Promise<Chamado> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Partial<Chamado>,
    @Req() request: Request,
  ): Promise<Chamado> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | Chamado> {
    const workspaceId = (request as any).workspace.id;
    return this.service.deleteOneByWorkspace(req, workspaceId);
  }

  @Post('abertura')
  @ApiOperation({ summary: 'Criar um novo chamado a partir do formulário de abertura' })
  async criarChamado(@Body() dto: CreateChamadoDto, @Req() request: Request) {
    const workspaceId = (request as any).workspace.id;
    return this.service.criarChamado(dto, workspaceId);
  }
}
