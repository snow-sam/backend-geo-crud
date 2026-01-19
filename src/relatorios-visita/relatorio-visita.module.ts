import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RelatorioVisita } from './relatorio-visita.entity';
import { RelatorioVisitaService } from './relatorio-visita.service';
import { RelatorioVisitaController } from './relatorio-visita.controller';
import { Visita } from '../visitas/visitas.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([RelatorioVisita, Visita]), AuthModule],
  providers: [RelatorioVisitaService],
  exports: [RelatorioVisitaService],
  controllers: [RelatorioVisitaController],
})
export class RelatorioVisitaModule {}

