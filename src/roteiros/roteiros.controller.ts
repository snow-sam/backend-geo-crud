import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { Roteiro } from './roteiros.entity';
import { RoteirosService } from './roteiros.service';

@Crud({
  model: { type: Roteiro }
})
@ApiTags('roteiros')
@Controller('roteiros')
export class RoteirosController implements CrudController<Roteiro> {
  constructor(public service: RoteirosService) {}
}
