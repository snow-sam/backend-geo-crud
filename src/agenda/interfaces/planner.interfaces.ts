/**
 * Interfaces para o Solver MILP de Planejamento de Visitas Técnicas
 * 
 * Define os tipos de entrada e saída do solver, além de conversores
 * entre as entidades TypeORM e o formato esperado pelo otimizador.
 */

import type { Cliente } from '../../clientes/clientes.entity';
import type { Tecnico } from '../../tecnicos/tecnicos.entity';

// ============================================================================
// INTERFACES DE ENTRADA DO SOLVER
// ============================================================================

/**
 * Representa um técnico no formato esperado pelo solver
 */
export interface TechnicianInput {
  id: string;
  daily_capacity: number;
  home_lat: number;
  home_lng: number;
  /** Dias do mês em que o técnico está indisponível (1-indexed) */
  unavailable_days: number[];
}

/**
 * Representa um cliente no formato esperado pelo solver
 */
export interface ClientInput {
  id: string;
  lat: number;
  lng: number;
  /** Número de visitas necessárias por mês */
  frequency_per_month: number;
  /** Prioridade do cliente (maior = mais importante) */
  priority?: number;
}

/**
 * Entrada completa do solver MILP
 */
export interface PlannerInput {
  technicians: TechnicianInput[];
  clients: ClientInput[];
  /** Número de dias úteis no mês */
  month_days: number;
  /** Lista de datas dos dias úteis (formato YYYY-MM-DD) */
  working_dates?: string[];
  /** Matriz de distâncias pré-calculada (opcional) */
  distance_matrix?: number[][];
}

// ============================================================================
// INTERFACES DE SAÍDA DO SOLVER
// ============================================================================

/**
 * Atribuição de um técnico para um dia específico
 */
export interface DayAssignment {
  technician: string;
  clients: string[];
}

/**
 * Estatísticas da solução encontrada
 */
export interface SolutionStatistics {
  /** Distância total estimada em km */
  total_distance: number;
  /** Status do modelo: OPTIMAL, FEASIBLE, INFEASIBLE, etc. */
  model_status: string;
  /** Tempo de resolução em ms */
  solve_time_ms?: number;
  /** Número de variáveis no modelo */
  num_variables?: number;
  /** Número de restrições no modelo */
  num_constraints?: number;
  /** Gap de otimalidade (para soluções não-ótimas) */
  gap?: number;
}

/**
 * Saída completa do solver MILP
 */
export interface PlannerOutput {
  /** Cronograma por dia (chave = número do dia, 1-indexed) */
  by_day: Record<string, DayAssignment[]>;
  /** Lista de clientes cuja demanda não foi totalmente atendida */
  unmet_clients: string[];
  /** Detalhes sobre demanda não atendida por cliente */
  unmet_details?: Record<string, { required: number; scheduled: number }>;
  /** Estatísticas da solução */
  statistics: SolutionStatistics;
}

// ============================================================================
// INTERFACE LEGADA (compatibilidade com código existente)
// ============================================================================

/**
 * Formato de agenda por dia usado pelo sistema existente
 */
export interface DiaAgenda {
  data: string;
  visitas: {
    tecnico: Tecnico;
    clientes: Cliente[];
  }[];
}

// ============================================================================
// CONVERSORES
// ============================================================================

/**
 * Converte entidade Tecnico do TypeORM para formato do solver
 */
export function technicianToInput(
  tecnico: Tecnico,
  unavailableDays: number[] = []
): TechnicianInput {
  return {
    id: tecnico.id,
    daily_capacity: tecnico.capacidadeDiaria,
    home_lat: tecnico.latitude,
    home_lng: tecnico.longitude,
    unavailable_days: unavailableDays,
  };
}

/**
 * Converte entidade Cliente do TypeORM para formato do solver
 */
export function clientToInput(cliente: Cliente): ClientInput {
  return {
    id: cliente.id,
    lat: cliente.latitude,
    lng: cliente.longitude,
    frequency_per_month: cliente.visitasMensais,
    priority: cliente.prioridade,
  };
}

/**
 * Converte lista de técnicos do TypeORM para formato do solver
 */
export function techniciansToInput(
  tecnicos: Tecnico[],
  unavailabilityMap: Map<string, number[]> = new Map()
): TechnicianInput[] {
  return tecnicos.map((t) => 
    technicianToInput(t, unavailabilityMap.get(t.id) || [])
  );
}

/**
 * Converte lista de clientes do TypeORM para formato do solver
 */
export function clientsToInput(clientes: Cliente[]): ClientInput[] {
  return clientes.map(clientToInput);
}

/**
 * Converte saída do solver para formato DiaAgenda legado
 */
export function outputToDiaAgenda(
  output: PlannerOutput,
  workingDates: string[],
  tecnicos: Tecnico[],
  clientes: Cliente[]
): DiaAgenda[] {
  const tecnicoMap = new Map(tecnicos.map((t) => [t.id, t]));
  const clienteMap = new Map(clientes.map((c) => [c.id, c]));

  return workingDates.map((data, index) => {
    const dayNumber = (index + 1).toString();
    const dayAssignments = output.by_day[dayNumber] || [];

    return {
      data,
      visitas: dayAssignments
        .filter((assignment) => assignment.clients.length > 0)
        .map((assignment) => ({
          tecnico: tecnicoMap.get(assignment.technician)!,
          clientes: assignment.clients
            .map((clientId) => clienteMap.get(clientId)!)
            .filter(Boolean),
        })),
    };
  });
}

/**
 * Cria input do solver a partir das entidades TypeORM
 */
export function createPlannerInput(
  tecnicos: Tecnico[],
  clientes: Cliente[],
  diasUteis: string[],
  unavailabilityMap: Map<string, number[]> = new Map()
): PlannerInput {
  return {
    technicians: techniciansToInput(tecnicos, unavailabilityMap),
    clients: clientsToInput(clientes),
    month_days: diasUteis.length,
    working_dates: diasUteis,
  };
}

