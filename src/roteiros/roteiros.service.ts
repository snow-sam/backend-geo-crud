import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Roteiro } from "./roteiros.entity";
import type { Repository } from "typeorm";
import { WorkspaceCrudService } from "../common/workspace-crud.service";

@Injectable()
export class RoteirosService extends WorkspaceCrudService<Roteiro> {
  constructor(@InjectRepository(Roteiro) repo: Repository<Roteiro>) {
    super(repo);
  }
}