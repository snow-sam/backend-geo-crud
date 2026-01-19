import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { Cliente } from '../clientes/clientes.entity';
import { Tecnico } from '../tecnicos/tecnicos.entity';
import { Visita } from '../visitas/visitas.entity';
import { Chamado } from '../chamados/chamados.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente, Tecnico, Visita, Chamado]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

