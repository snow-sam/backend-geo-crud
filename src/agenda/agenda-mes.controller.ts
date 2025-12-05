import { Controller, Post, Body } from '@nestjs/common';
import { MonthlyPlannerService } from './agenda-mes.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { TecnicosService } from 'src/tecnicos/tecnicos.service';
import { VisitasService } from 'src/visitas/visitas.service';
import { gerarDiasUteisMes } from 'src/utils/dias-uteis.util';
import { GerarAgendaDto } from './dto/gerar-agenda.dto';
import { Between, Not } from 'typeorm';

@Controller('agenda')
export class AgendaMesController {
  constructor(
    private agendaService: MonthlyPlannerService,
    private clientesService: ClientesService,
    private tecnicosService: TecnicosService,
    private visitasService: VisitasService,
  ) {}

  @Post('mes')
  async planejaMes(@Body() dto: GerarAgendaDto) {
    const dataReferencia = new Date(dto.data);

    // Calcula início e fim do mês
    const inicioMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
    const fimMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0, 23, 59, 59, 999);

    // Busca todos os clientes
    const todosClientes = await this.clientesService.find();

    // Busca visitas realizadas no mês (status diferente de 'pendente')
    const visitasRealizadas = await this.visitasService.find({
      where: {
        dataAgendamento: Between(inicioMes, fimMes),
        status: Not('pendente'),
      },
    });

    // Conta visitas por cliente
    const visitasPorCliente = new Map<string, number>();
    for (const visita of visitasRealizadas) {
      const count = visitasPorCliente.get(visita.clienteId) ?? 0;
      visitasPorCliente.set(visita.clienteId, count + 1);
    }

    // Filtra clientes que ainda precisam de visitas
    const clientesFiltrados = todosClientes.filter((cliente) => {
      const visitasFeitas = visitasPorCliente.get(cliente.id) ?? 0;
      return visitasFeitas < cliente.visitasMensais;
    });

    // Busca apenas técnicos ativos
    const tecnicos = await this.tecnicosService.find({
      where: { eAtivo: true },
    });

    // Gera dias úteis a partir da data informada
    const diasUteis = gerarDiasUteisMes({ inicioEm: dataReferencia });

    // Gera a agenda mensal otimizada via MILP
    const agenda = await this.agendaService.gerarAgendaCompleta(
      clientesFiltrados,
      tecnicos,
      diasUteis,
      { reservaEmergenciaPercentual: 0.2 },
    );

    return agenda;
  }
}
