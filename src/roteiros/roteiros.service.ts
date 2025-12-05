import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { Roteiro } from "./roteiros.entity";
import type { Repository } from "typeorm";

@Injectable()
export class RoteirosService extends TypeOrmCrudService<Roteiro> {
  constructor(@InjectRepository(Roteiro) repo: Repository<Roteiro>) {
    super(repo);
  }
}