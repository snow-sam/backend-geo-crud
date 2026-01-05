import { Controller, Get, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tecnico } from './tecnicos.entity';
import { TecnicosService } from './tecnicos.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roteiro } from '../roteiros/roteiros.entity';

@ApiTags('tecnico-portal')
@UseGuards(AuthGuard)
@Controller('tecnico')
export class TecnicoPortalController {
  constructor(
    private readonly tecnicosService: TecnicosService,
    @InjectRepository(Roteiro) private readonly roteiroRepo: Repository<Roteiro>,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Buscar o técnico do usuário autenticado (Portal do Técnico)' })
  async me(@Req() request: Request): Promise<Tecnico> {
    const email = request.user!.email;
    return this.tecnicosService.findByEmail(email);
  }

  @Get('roteiros')
  @ApiOperation({ summary: 'Buscar roteiros do técnico autenticado' })
  async meusRoteiros(@Req() request: Request): Promise<Roteiro[]> {
    const email = request.user!.email;
    const tecnico = await this.tecnicosService.findByEmail(email);

    return this.roteiroRepo.find({
      where: { tecnicoId: tecnico.id },
      relations: ['visitas', 'visitas.cliente'],
      order: { data: 'DESC' },
    });
  }

  @Get('roteiros/:id')
  @ApiOperation({ summary: 'Buscar detalhes de um roteiro do técnico autenticado' })
  async meuRoteiro(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<Roteiro> {
    const email = request.user!.email;
    const tecnico = await this.tecnicosService.findByEmail(email);

    const roteiro = await this.roteiroRepo.findOne({
      where: { id, tecnicoId: tecnico.id },
      relations: ['visitas', 'visitas.cliente', 'tecnico'],
    });

    if (!roteiro) {
      throw new NotFoundException('Roteiro não encontrado');
    }

    return roteiro;
  }
}

