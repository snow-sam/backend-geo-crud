import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { RoteiroCliente } from './roteiro-cliente.entity';
import { RoteiroClienteService } from './roteiro-cliente.service';

@Crud({
  model: { type: RoteiroCliente }
})
@ApiTags('roteiro-cliente')
@Controller('roteiro-cliente')
export class RoteiroClienteController implements CrudController<RoteiroCliente> {
  constructor(public service: RoteiroClienteService) {}
}
