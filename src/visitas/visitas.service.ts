import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Visita } from "./visitas.entity";
import type { Repository } from "typeorm";
import { WorkspaceCrudService } from "../common/workspace-crud.service";

@Injectable()
export class VisitasService extends WorkspaceCrudService<Visita> {
  constructor(@InjectRepository(Visita) repo: Repository<Visita>) {
    super(repo);
  }
}