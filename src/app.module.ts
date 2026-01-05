import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TecnicosModule } from './tecnicos/tecnicos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VisitasModule } from './visitas/visitas.module';
import { RoteirosModule } from './roteiros/roteiros.module';
import { ChamadosModule } from './chamados/chamados.module';
import { AgendaMesModule } from './agenda/agenda-mes.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RelatorioVisitaModule } from './relatorios-visita/relatorio-visita.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    DatabaseModule,
    WorkspacesModule,
    TecnicosModule,
    ClientesModule,
    VisitasModule,
    RoteirosModule,
    ChamadosModule,
    AgendaMesModule,
    AuthModule,
    DashboardModule,
    RelatorioVisitaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
