import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudRequest } from '@dataui/crud';

import { RelatorioVisita } from './relatorio-visita.entity';
import { WorkspaceCrudService } from '../common/workspace-crud.service';
import { Visita } from '../visitas/visitas.entity';

@Injectable()
export class RelatorioVisitaService extends WorkspaceCrudService<RelatorioVisita> {
  constructor(
    @InjectRepository(RelatorioVisita) repo: Repository<RelatorioVisita>,
    @InjectRepository(Visita) private visitaRepo: Repository<Visita>,
  ) {
    super(repo);
  }

  async createOneWithWorkspace(
    req: CrudRequest,
    dto: Partial<RelatorioVisita>,
    workspaceId: string,
  ): Promise<RelatorioVisita> {
    // Cria o relatório
    const relatorio = await super.createOneWithWorkspace(req, dto, workspaceId);

    // Atualiza o status da visita para "realizado" e a nota
    if (dto.visitaId) {
      await this.visitaRepo.update(
        { id: dto.visitaId, workspaceId },
        { 
          status: 'realizado', 
          realizadoEm: new Date(),
          notas: dto.observacoesAvaliacao || dto.descricaoGeral,
        },
      );
    }

    return relatorio;
  }
}

