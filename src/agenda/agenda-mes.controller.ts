import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Request } from 'express';
import { MonthlyPlannerService, ResultadoAgenda } from './agenda-mes.service';
import { FleetRoutingService, ResultadoRoteirizacao } from './fleet-routing.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { TecnicosService } from 'src/tecnicos/tecnicos.service';
import { VisitasService } from 'src/visitas/visitas.service';
import { Visita } from 'src/visitas/visitas.entity';
import { Roteiro } from 'src/roteiros/roteiros.entity';
import { Cliente } from 'src/clientes/clientes.entity';
import { Tecnico } from 'src/tecnicos/tecnicos.entity';
import { gerarDiasUteisMes } from 'src/utils/dias-uteis.util';
import { GerarAgendaDto } from './dto/gerar-agenda.dto';
import { GerarRoteiroDiaDto } from './dto/gerar-roteiro-dia.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

interface ResultadoAgendaComPersistencia extends ResultadoAgenda {
  visitasCriadas?: number;
  visitasDeletadas?: number;
}

interface ResultadoRoteiroDia extends ResultadoRoteirizacao {
  roteirosCriados?: number;
  visitasVinculadas?: number;
}

@UseGuards(AuthGuard)
@Controller('agenda')
export class AgendaMesController {
  constructor(
    private agendaService: MonthlyPlannerService,
    private fleetRoutingService: FleetRoutingService,
    private clientesService: ClientesService,
    private tecnicosService: TecnicosService,
    private visitasService: VisitasService,
    @InjectRepository(Visita)
    private visitasRepository: Repository<Visita>,
    @InjectRepository(Roteiro)
    private roteiroRepository: Repository<Roteiro>,
  ) {}

  @Post('mes')
  async planejaMes(@Body() dto: GerarAgendaDto, @Req() request: Request): Promise<ResultadoAgendaComPersistencia> {
    const workspaceId = (request as any).workspace.id;
    const dataReferencia = new Date(dto.data);

    // Calcula início e fim do mês
    const inicioMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
    const fimMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0, 23, 59, 59, 999);

    // Busca todos os clientes do workspace
    const todosClientes = await this.clientesService.find({
      where: { workspaceId },
    });

    // Busca visitas realizadas no mês (status diferente de 'pendente') do workspace
    const visitasRealizadas = await this.visitasService.find({
      where: {
        workspaceId,
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

    // Busca apenas técnicos ativos do workspace
    const tecnicos = await this.tecnicosService.find({
      where: { workspaceId, eAtivo: true },
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

    // Se solicitado, persiste a agenda no banco de dados
    if (dto.salvar) {
      // Deleta visitas pendentes existentes no período do workspace
      const resultadoDelete = await this.visitasRepository.delete({
        workspaceId,
        dataAgendamento: Between(inicioMes, fimMes),
        status: 'pendente',
      });

      // Cria novas visitas a partir da agenda gerada
      const novasVisitas: Partial<Visita>[] = [];
      for (const dia of agenda.agenda) {
        // Cria data de agendamento com horário 08:00
        const [ano, mes, diaNum] = dia.data.split('-').map(Number);
        const dataAgendamento = new Date(ano, mes - 1, diaNum, 8, 0, 0);

        for (const visitaDia of dia.visitas) {
          for (const cliente of visitaDia.clientes) {
            novasVisitas.push({
              workspaceId,
              clienteId: cliente.id,
              tecnicoId: visitaDia.tecnico.id,
              dataAgendamento,
              status: 'pendente',
            });
          }
        }
      }
      // Insere todas as novas visitas em batch
      if (novasVisitas.length > 0) {
        await this.visitasRepository.insert(novasVisitas);
      }

      return {
        ...agenda,
        visitasCriadas: novasVisitas.length,
        visitasDeletadas: resultadoDelete.affected ?? 0,
      };
    }

    return agenda;
  }

  /**
   * Gera roteiros otimizados para um dia específico usando Google Fleet Routing
   *
   * Busca as visitas pendentes do dia, agrupa por técnico e chama a API de
   * otimização para definir a melhor ordem de visitas.
   */
  @Post('roteiro-dia')
  async gerarRoteiroDia(@Body() dto: GerarRoteiroDiaDto, @Req() request: Request): Promise<ResultadoRoteiroDia> {
    const workspaceId = (request as any).workspace.id;
    const [ano, mes, dia] = dto.data.split('-').map(Number);
    const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0);
    const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

    // Busca visitas pendentes do dia com dados de cliente e técnico do workspace
    const visitasDoDia = await this.visitasRepository.find({
      where: {
        workspaceId,
        dataAgendamento: Between(inicioDia, fimDia),
        status: 'pendente',
      },
      relations: ['cliente', 'tecnico'],
    });

    if (visitasDoDia.length === 0) {
      return {
        data: dto.data,
        roteiros: [],
        sucessoTotal: true,
      };
    }

    // Agrupa visitas por técnico (usando tecnicoId como chave para evitar duplicação)
    const tecnicosMap = new Map<string, Tecnico>();
    const clientesPorTecnicoId = new Map<string, Cliente[]>();

    for (const visita of visitasDoDia) {
      if (!visita.tecnico || !visita.cliente) continue;

      const tecnicoId = visita.tecnico.id;
      
      // Guarda referência do técnico
      if (!tecnicosMap.has(tecnicoId)) {
        tecnicosMap.set(tecnicoId, visita.tecnico);
      }

      // Agrupa clientes por técnico
      const clientesDoTecnico = clientesPorTecnicoId.get(tecnicoId) || [];
      clientesDoTecnico.push(visita.cliente);
      clientesPorTecnicoId.set(tecnicoId, clientesDoTecnico);
    }

    // Converte para Map<Tecnico, Cliente[]> para o FleetRoutingService
    const visitasPorTecnico = new Map<Tecnico, Cliente[]>();
    for (const [tecnicoId, clientes] of clientesPorTecnicoId) {
      const tecnico = tecnicosMap.get(tecnicoId)!;
      visitasPorTecnico.set(tecnico, clientes);
    }

    // Gera roteiros otimizados via Fleet Routing
    const resultado = await this.fleetRoutingService.gerarRoteiros(
      dto.data,
      visitasPorTecnico,
    );

    // Se solicitado, persiste os roteiros no banco
    if (dto.salvar && resultado.roteiros.length > 0) {
      // Deleta roteiros existentes do dia do workspace
      const roteirosExistentes = await this.roteiroRepository.find({
        where: {
          workspaceId,
          data: Between(inicioDia, fimDia),
        },
      });

      if (roteirosExistentes.length > 0) {
        const idsExistentes = roteirosExistentes.map((r) => r.id);
        // Desvincula visitas dos roteiros existentes e volta status para pendente
        await this.visitasRepository.update(
          { roteiroId: In(idsExistentes) },
          { 
            roteiroId: null as unknown as string, 
            ordem: null as unknown as number, 
            status: 'pendente',
            estimativaChegada: null as unknown as Date, 
            distanciaProximoKM: null as unknown as number, 
            distanciaProximoMinutos: null as unknown as number,
          },
        );
        await this.roteiroRepository.delete(idsExistentes);
      }

      let roteirosCriados = 0;
      let visitasVinculadas = 0;

      // Cria novos roteiros e vincula as visitas
      for (const roteiroOtimizado of resultado.roteiros) {
        const roteiro = this.roteiroRepository.create({
          workspaceId,
          tecnicoId: roteiroOtimizado.tecnico.id,
          data: new Date(dto.data),
          status: 'PLANNED',
          distanciaTotal: roteiroOtimizado.distanciaTotalKM,
          tempoEstimado: Math.round(roteiroOtimizado.tempoTotalMinutos),
        });

        const roteiroSalvo = await this.roteiroRepository.save(roteiro);
        roteirosCriados++;

        // Atualiza as visitas com os dados do roteiro otimizado
        for (const visitaOtimizada of roteiroOtimizado.visitas) {
          if (!visitaOtimizada.cliente) continue;

          // Encontra a visita correspondente no array de visitas do dia
          const visitaOriginal = visitasDoDia.find(
            (v) => v.clienteId === visitaOtimizada.cliente.id && v.tecnicoId === roteiroOtimizado.tecnico.id,
          );

          if (visitaOriginal) {
            await this.visitasRepository.update(visitaOriginal.id, {
              roteiroId: roteiroSalvo.id,
              ordem: visitaOtimizada.ordem,
              tipo: 'PREVENTIVE',
              status: 'no_roteiro',
              estimativaChegada: visitaOtimizada.estimativaChegada,
              distanciaProximoKM: visitaOtimizada.distanciaProximoKM,
              distanciaProximoMinutos: visitaOtimizada.tempoProximoMinutos,
            });
            visitasVinculadas++;
          }
        }
      }

      return {
        ...resultado,
        roteirosCriados,
        visitasVinculadas,
      };
    }

    return resultado;
  }

  /**
   * Retorna informações de configuração do Fleet Routing
   */
  @Get('fleet-routing/config')
  getFleetRoutingConfig() {
    return this.fleetRoutingService.getConfigInfo();
  }
}
