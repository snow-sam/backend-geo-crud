import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TecnicosModule } from './tecnicos/tecnicos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VisitasModule } from './visitas/visitas.module';
import { RoteirosModule } from './roteiros/roteiros.module';
import { ChamadosModule } from './chamados/chamados.module';
import { RoteiroClienteModule } from './roteiro-cliente/roteiro-cliente.module';
import { AgendaMesModule } from './agenda/agenda-mes.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    DatabaseModule,
    TecnicosModule,
    ClientesModule,
    VisitasModule,
    RoteirosModule,
    ChamadosModule,
    RoteiroClienteModule,
    AgendaMesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
