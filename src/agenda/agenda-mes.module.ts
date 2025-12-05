import { Module } from "@nestjs/common";
import { ClientesModule } from "src/clientes/clientes.module";
import { TecnicosModule } from "src/tecnicos/tecnicos.module";
import { VisitasModule } from "src/visitas/visitas.module";
import { MonthlyPlannerService } from "./agenda-mes.service";
import { AgendaMesController } from "./agenda-mes.controller";

@Module({
  imports: [ClientesModule, TecnicosModule, VisitasModule],
  providers: [MonthlyPlannerService],
  exports: [MonthlyPlannerService],
  controllers: [AgendaMesController]
})
export class AgendaMesModule {}