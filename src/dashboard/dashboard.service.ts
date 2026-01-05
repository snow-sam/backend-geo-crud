import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cliente } from '../clientes/clientes.entity';
import { Tecnico } from '../tecnicos/tecnicos.entity';
import { Visita } from '../visitas/visitas.entity';
import { Chamado } from '../chamados/chamados.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Tecnico)
    private readonly tecnicoRepository: Repository<Tecnico>,
    @InjectRepository(Visita)
    private readonly visitaRepository: Repository<Visita>,
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
  ) {}

  async getStats(workspaceId: string): Promise<DashboardStatsDto> {
    const [totalClientes, tecnicosAtivos, visitasAgendadas, chamadosAbertos] =
      await Promise.all([
        this.getTotalClientes(workspaceId),
        this.getTecnicosAtivos(workspaceId),
        this.getVisitasAgendadas(workspaceId),
        this.getChamadosAbertos(workspaceId),
      ]);

    return {
      totalClientes,
      tecnicosAtivos,
      visitasAgendadas,
      chamadosAbertos,
    };
  }

  private async getTotalClientes(workspaceId: string): Promise<number> {
    return this.clienteRepository.count({
      where: { workspaceId },
    });
  }

  private async getTecnicosAtivos(workspaceId: string): Promise<number> {
    return this.tecnicoRepository.count({
      where: { 
        workspaceId,
        eAtivo: true,
      },
    });
  }

  private async getVisitasAgendadas(workspaceId: string): Promise<number> {
    return this.visitaRepository.count({
      where: {
        workspaceId,
        status: 'pendente',
      },
    });
  }

  private async getChamadosAbertos(workspaceId: string): Promise<number> {
    return this.chamadoRepository.count({
      where: {
        workspaceId,
        status: 'aberto',
      },
    });
  }
}

