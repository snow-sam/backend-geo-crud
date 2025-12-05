import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ApiTags } from '@nestjs/swagger';

import { Tecnico } from './tecnicos.entity';
import { TecnicosService } from './tecnicos.service';
import { CreateTecnicoDto } from './dtos/create-tecnico.dto';
import { UpdateTecnicoDto } from './dtos/update-tecnico.dto';

@Crud({
  model: { type: Tecnico },
  dto: {
    create: CreateTecnicoDto,
    update: UpdateTecnicoDto,
  },
})
@ApiTags('tecnicos')
@Controller('tecnicos')
export class TecnicosController implements CrudController<Tecnico> {
  constructor(public service: TecnicosService) {}
}
