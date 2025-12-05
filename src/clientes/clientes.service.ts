import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";

import { Cliente } from "./clientes.entity";
import type { Repository } from "typeorm";

@Injectable()
export class ClientesService extends TypeOrmCrudService<Cliente> {
  constructor(@InjectRepository(Cliente) repo: Repository<Cliente>) {
    super(repo);
  }
}