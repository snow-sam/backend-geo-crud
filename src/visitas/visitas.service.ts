import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { Visita } from "./visitas.entity";
import type { Repository } from "typeorm";

@Injectable()
export class VisitasService extends TypeOrmCrudService<Visita> {
  constructor(@InjectRepository(Visita) repo: Repository<Visita>) {
    super(repo);
  }
}