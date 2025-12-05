import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { Cliente } from './clientes.entity';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';

@Crud({
  model: { type: Cliente },
  dto: {
    create: CreateClienteDto,
    update: UpdateClienteDto,
  },
})
@ApiTags('clientes')
@Controller('clientes')
export class ClientesController implements CrudController<Cliente> {
  constructor(public service: ClientesService) {}
}
