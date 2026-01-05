import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Chamado } from "./chamados.entity";
import { CreateChamadoDto } from "./dtos/create-chamado.dto";
import type { Repository } from "typeorm";
import { WorkspaceCrudService } from "../common/workspace-crud.service";

@Injectable()
export class ChamadosService extends WorkspaceCrudService<Chamado> {
  constructor(@InjectRepository(Chamado) repo: Repository<Chamado>) {
    super(repo);
  }

  async criarChamado(dto: CreateChamadoDto, workspaceId: string): Promise<Chamado> {
    const chamado = this.repo.create({
      ...dto,
      workspaceId,
      dataAbertura: new Date(),
      status: 'aberto',
      local: dto.enderecoCompleto,
      tipo: 'suporte',
      descricao: dto.descricaoProblema,
    });
    return this.repo.save(chamado);
  }
}