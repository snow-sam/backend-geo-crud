import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { Chamado } from './chamados.entity';
import { ChamadosService } from './chamados.service';

@Crud({
  model: { type: Chamado }
})
@ApiTags('chamados')
@Controller('chamados')
export class ChamadosController implements CrudController<Chamado> {
  constructor(public service: ChamadosService) {}
}
