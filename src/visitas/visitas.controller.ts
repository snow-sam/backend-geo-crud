import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { Visita } from './visitas.entity';
import { VisitasService } from './visitas.service';

@Crud({
  model: { type: Visita }
})
@ApiTags('visitas')
@Controller('visitas')
export class VisitasController implements CrudController<Visita> {
  constructor(public service: VisitasService) {}
}
