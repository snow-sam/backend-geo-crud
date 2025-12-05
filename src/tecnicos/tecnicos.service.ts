import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { Tecnico } from "./tecnicos.entity";
import type { Repository } from "typeorm";

@Injectable()
export class TecnicosService extends TypeOrmCrudService<Tecnico> {
  constructor(@InjectRepository(Tecnico) repo: Repository<Tecnico>) {
    super(repo);
  }
}