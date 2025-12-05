import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { RoteiroCliente } from "./roteiro-cliente.entity";
import type { Repository } from "typeorm";

@Injectable()
export class RoteiroClienteService extends TypeOrmCrudService<RoteiroCliente> {
  constructor(@InjectRepository(RoteiroCliente) repo: Repository<RoteiroCliente>) {
    super(repo);
  }
}