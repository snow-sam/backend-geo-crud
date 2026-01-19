import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RelatorioVisita } from './relatorio-visita.entity';
import { RelatorioVisitaService } from './relatorio-visita.service';
import { RelatorioVisitaController } from './relatorio-visita.controller';
import { Visita } from '../visitas/visitas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RelatorioVisita, Visita])],
  providers: [RelatorioVisitaService],
  exports: [RelatorioVisitaService],
  controllers: [RelatorioVisitaController],
})
export class RelatorioVisitaModule {}

