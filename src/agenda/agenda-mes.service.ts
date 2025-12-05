/**
 * MonthlyPlannerService - Serviço de Planejamento Mensal de Visitas Técnicas
 * 
 * Utiliza MILP (Mixed Integer Linear Programming) via HiGHS para otimização
 * global do cronograma de visitas, minimizando distância total percorrida
 * enquanto respeita restrições de capacidade e frequência.
 * 
 * ============================================================================
 * MODELAGEM MATEMÁTICA
 * ============================================================================
 * 
 * Variáveis de Decisão:
 *   x[t,c,d] ∈ {0,1} = 1 se técnico t visita cliente c no dia d
 *   unmet[c] ∈ Z+    = demanda não atendida do cliente c
 * 
 * Função Objetivo:
 *   minimize Σ(t,c,d) x[t,c,d] * distance[t,c] + M * Σc unmet[c]
 * 
 * Restrições:
 *   (1) Capacidade: Σc x[t,c,d] ≤ capacity[t], ∀t,d
 *   (2) Frequência: Σ(t,d) x[t,c,d] + unmet[c] ≥ frequency[c], ∀c
 *   (3) Uma visita/dia: Σt x[t,c,d] ≤ 1, ∀c,d
 *   (4) Indisponibilidade: x[t,c,d] = 0 se técnico indisponível
 * 
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import type { Cliente } from '../clientes/clientes.entity';
import type { Tecnico } from '../tecnicos/tecnicos.entity';
import { solveMilpModel, formatSolutionForDisplay } from './milp/model-builder';
import {
  type DiaAgenda,
  type PlannerInput,
  type PlannerOutput,
  createPlannerInput,
  outputToDiaAgenda,
} from './interfaces/planner.interfaces';

// Re-exportar interface para compatibilidade
export type { DiaAgenda };

/**
 * Opções para geração de agenda
 */
export interface GerarAgendaOptions {
  /** Percentual de capacidade reservada para emergências (0-1) */
  reservaEmergenciaPercentual?: number;
  /** Mapa de dias indisponíveis por técnico (tecnicoId -> dias do mês 1-indexed) */
  indisponibilidades?: Map<string, number[]>;
  /** Timeout para o solver em milissegundos */
  timeoutMs?: number;
}

/**
 * Resultado completo da geração de agenda
 */
export interface ResultadoAgenda {
  /** Agenda no formato legado (compatível com código existente) */
  agenda: DiaAgenda[];
  /** Clientes cuja demanda não foi totalmente atendida */
  clientesNaoAtendidos: string[];
  /** Estatísticas da solução */
  estatisticas: {
    distanciaTotal: number;
    statusModelo: string;
    tempoResolucaoMs?: number;
  };
}

@Injectable()
export class MonthlyPlannerService {
  /**
   * Gera agenda mensal otimizada usando MILP
   * 
   * Este método substitui o algoritmo greedy anterior por uma abordagem
   * de otimização global que encontra a solução ótima (ou próxima do ótimo)
   * considerando todas as restrições simultaneamente.
   * 
   * @param clientes - Lista de clientes a serem visitados
   * @param tecnicos - Lista de técnicos disponíveis
   * @param diasUteis - Lista de datas dos dias úteis (formato YYYY-MM-DD)
   * @param reservaEmergenciaPercentual - Capacidade reservada para emergências
   * @param options - Opções adicionais (indisponibilidades, etc)
   * @returns Agenda otimizada no formato DiaAgenda[]
   */
  async gerarAgendaMensal(
    clientes: Cliente[],
    tecnicos: Tecnico[],
    diasUteis: string[],
    reservaEmergenciaPercentual = 0.2,
    options: GerarAgendaOptions = {}
  ): Promise<DiaAgenda[]> {
    const resultado = await this.gerarAgendaCompleta(
      clientes,
      tecnicos,
      diasUteis,
      { ...options, reservaEmergenciaPercentual }
    );
    return resultado.agenda;
  }

  /**
   * Gera agenda mensal completa com estatísticas e informações de fallback
   * 
   * @param clientes - Lista de clientes
   * @param tecnicos - Lista de técnicos
   * @param diasUteis - Lista de dias úteis
   * @param options - Opções de geração
   * @returns Resultado completo incluindo agenda, clientes não atendidos e estatísticas
   */
  async gerarAgendaCompleta(
    clientes: Cliente[],
    tecnicos: Tecnico[],
    diasUteis: string[],
    options: GerarAgendaOptions = {}
  ): Promise<ResultadoAgenda> {
    const {
      reservaEmergenciaPercentual = 0.2,
      indisponibilidades = new Map(),
    } = options;

    // Validações básicas
    if (tecnicos.length === 0) {
      return {
        agenda: diasUteis.map(data => ({ data, visitas: [] })),
        clientesNaoAtendidos: clientes.map(c => c.id),
        estatisticas: {
          distanciaTotal: 0,
          statusModelo: 'NO_TECHNICIANS',
        },
      };
    }

    if (clientes.length === 0) {
      return {
        agenda: diasUteis.map(data => ({
          data,
          visitas: tecnicos.map(t => ({ tecnico: t, clientes: [] })),
        })),
        clientesNaoAtendidos: [],
        estatisticas: {
          distanciaTotal: 0,
          statusModelo: 'OPTIMAL',
        },
      };
    }

    // Ajustar capacidade considerando reserva para emergências
    const tecnicosAjustados = tecnicos.map(t => ({
      ...t,
      capacidadeDiaria: Math.floor(t.capacidadeDiaria * (1 - reservaEmergenciaPercentual)),
    }));

    // Criar input do solver
    const plannerInput = createPlannerInput(
      tecnicosAjustados,
      clientes,
      diasUteis,
      indisponibilidades
    );

    // Resolver modelo MILP
    const output = await solveMilpModel(plannerInput);

    // Converter para formato legado
    const agenda = outputToDiaAgenda(output, diasUteis, tecnicos, clientes);

    return {
      agenda,
      clientesNaoAtendidos: output.unmet_clients,
      estatisticas: {
        distanciaTotal: output.statistics.total_distance,
        statusModelo: output.statistics.model_status,
        tempoResolucaoMs: output.statistics.solve_time_ms,
      },
    };
  }

  /**
   * Gera agenda e retorna no formato otimizado para Google Fleet Routing
   * 
   * O output é estruturado por dia e por técnico, facilitando a integração
   * com APIs de roteirização externas.
   * 
   * @param clientes - Lista de clientes
   * @param tecnicos - Lista de técnicos
   * @param diasUteis - Lista de dias úteis
   * @param options - Opções de geração
   * @returns Output no formato PlannerOutput (ideal para Fleet Routing)
   */
  async gerarAgendaParaFleetRouting(
    clientes: Cliente[],
    tecnicos: Tecnico[],
    diasUteis: string[],
    options: GerarAgendaOptions = {}
  ): Promise<PlannerOutput> {
    const {
      reservaEmergenciaPercentual = 0.2,
      indisponibilidades = new Map(),
    } = options;

    // Ajustar capacidade
    const tecnicosAjustados = tecnicos.map(t => ({
      ...t,
      capacidadeDiaria: Math.floor(t.capacidadeDiaria * (1 - reservaEmergenciaPercentual)),
    }));

    // Criar input e resolver
    const plannerInput = createPlannerInput(
      tecnicosAjustados,
      clientes,
      diasUteis,
      indisponibilidades
    );

    return solveMilpModel(plannerInput);
  }

  /**
   * Gera agenda e formata para exibição de debug/log
   */
  async gerarAgendaFormatada(
    clientes: Cliente[],
    tecnicos: Tecnico[],
    diasUteis: string[],
    options: GerarAgendaOptions = {}
  ): Promise<string> {
    const output = await this.gerarAgendaParaFleetRouting(
      clientes,
      tecnicos,
      diasUteis,
      options
    );
    return formatSolutionForDisplay(output);
  }

  /**
   * Resolve diretamente a partir de um PlannerInput
   * 
   * Útil para testes e quando os dados já estão no formato do solver.
   */
  async resolverInput(input: PlannerInput): Promise<PlannerOutput> {
    return solveMilpModel(input);
  }
}
