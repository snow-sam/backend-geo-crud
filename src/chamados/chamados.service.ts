import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { Chamado } from "./chamados.entity";
import type { Repository } from "typeorm";

@Injectable()
export class ChamadosService extends TypeOrmCrudService<Chamado> {
  constructor(@InjectRepository(Chamado) repo: Repository<Chamado>) {
    super(repo);
  }
}