import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientesModule } from "src/clientes/clientes.module";
import { TecnicosModule } from "src/tecnicos/tecnicos.module";
import { VisitasModule } from "src/visitas/visitas.module";
import { AuthModule } from "src/auth/auth.module";
import { Visita } from "src/visitas/visitas.entity";
import { Roteiro } from "src/roteiros/roteiros.entity";
import { MonthlyPlannerService } from "./agenda-mes.service";
import { FleetRoutingService } from "./fleet-routing.service";
import { AgendaMesController } from "./agenda-mes.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Visita, Roteiro]),
    ClientesModule,
    TecnicosModule,
    VisitasModule,
    AuthModule,
  ],
  providers: [MonthlyPlannerService, FleetRoutingService],
  exports: [MonthlyPlannerService, FleetRoutingService],
  controllers: [AgendaMesController]
})
export class AgendaMesModule {}