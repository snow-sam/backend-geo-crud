/**
 * MILP Model Builder para Planejamento de Visitas Técnicas
 * 
 * Este módulo constrói e resolve um modelo de Programação Linear Inteira Mista (MILP)
 * para o problema de alocação de visitas técnicas usando o solver HiGHS.
 * 
 * ============================================================================
 * MODELAGEM MATEMÁTICA
 * ============================================================================
 * 
 * CONJUNTOS:
 *   T = conjunto de técnicos (índice t)
 *   C = conjunto de clientes (índice c)
 *   D = conjunto de dias úteis do mês (índice d)
 * 
 * PARÂMETROS:
 *   capacity[t] = capacidade diária do técnico t
 *   frequency[c] = número de visitas requeridas pelo cliente c no mês
 *   distance[t,c] = distância da casa do técnico t até o cliente c
 *   unavailable[t,d] = 1 se técnico t indisponível no dia d, 0 caso contrário
 *   M = penalidade grande para demanda não atendida
 * 
 * VARIÁVEIS DE DECISÃO:
 *   x[t,c,d] ∈ {0,1} = 1 se técnico t visita cliente c no dia d
 *   unmet[c] ∈ Z+ = demanda não atendida do cliente c
 * 
 * FUNÇÃO OBJETIVO:
 *   minimize Σ(t,c,d) x[t,c,d] * distance[t,c] + M * Σc unmet[c]
 * 
 * RESTRIÇÕES:
 *   (1) Capacidade diária: Σc x[t,c,d] ≤ capacity[t], ∀t,d
 *   (2) Frequência mensal: Σ(t,d) x[t,c,d] + unmet[c] ≥ frequency[c], ∀c
 *   (3) Uma visita por dia: Σt x[t,c,d] ≤ 1, ∀c,d
 *   (4) Indisponibilidade: x[t,c,d] = 0, ∀t,c,d onde unavailable[t,d] = 1
 * 
 * ============================================================================
 */

import type { PlannerInput, PlannerOutput, DayAssignment } from '../interfaces/planner.interfaces';
import { buildDistanceMatrix, type DistanceMatrix } from '../utils/distance.util';

// Tipo para o solver HiGHS
interface HighsOptions {
  log_to_console?: boolean;
  presolve?: 'off' | 'choose' | 'on';
  time_limit?: number;
  mip_rel_gap?: number;
}

interface HighsSolver {
  solve(problem: string, options?: HighsOptions): {
    Status: string;
    ObjectiveValue?: number;
    Columns?: Record<string, { Primal: number }>;
  };
}

// Cache do solver HiGHS (singleton)
let highsInstance: HighsSolver | null = null;

/**
 * Obtém instância do solver HiGHS (cached)
 */
async function getHighsSolver(): Promise<HighsSolver> {
  if (!highsInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const highsLoader = require('highs');
    highsInstance = await highsLoader();
  }
  return highsInstance!;
}

// Penalidade para demanda não atendida (valor grande para priorizar atendimento)
// NOTA: Usar valores não muito grandes para evitar problemas numéricos no HiGHS-JS
const UNMET_PENALTY = 100;

/**
 * Índices para mapear variáveis do modelo
 */
interface VariableIndices {
  /** Mapa de variáveis x[t,c,d] -> índice da variável */
  x: Map<string, number>;
  /** Mapa de variáveis unmet[c] -> índice da variável */
  unmet: Map<string, number>;
  /** Número total de variáveis */
  totalVars: number;
}

/**
 * Gera chave única para variável x[t,c,d]
 */
function xKey(techIndex: number, clientIndex: number, dayIndex: number): string {
  return `x_${techIndex}_${clientIndex}_${dayIndex}`;
}

/**
 * Gera chave única para variável unmet[c]
 */
function unmetKey(clientIndex: number): string {
  return `unmet_${clientIndex}`;
}

/**
 * Cria índices para todas as variáveis do modelo
 * IMPORTANTE: As variáveis unmet usam índices separados (começando do 0)
 * para evitar bugs no parser do HiGHS-JS
 */
function createVariableIndices(
  numTechnicians: number,
  numClients: number,
  numDays: number,
  unavailableSet: Set<string>
): VariableIndices {
  const x = new Map<string, number>();
  const unmet = new Map<string, number>();
  let xIndex = 0;

  // Variáveis x[t,c,d] - binárias
  // Não criamos variáveis para combinações onde o técnico está indisponível
  for (let t = 0; t < numTechnicians; t++) {
    for (let c = 0; c < numClients; c++) {
      for (let d = 0; d < numDays; d++) {
        const unavailKey = `${t}_${d}`;
        if (!unavailableSet.has(unavailKey)) {
          x.set(xKey(t, c, d), xIndex++);
        }
      }
    }
  }

  // Variáveis unmet[c] - inteiras (índices separados, começando do 0)
  for (let c = 0; c < numClients; c++) {
    unmet.set(unmetKey(c), c); // Usa o próprio índice do cliente
  }

  return { x, unmet, totalVars: xIndex + numClients };
}

/**
 * Constrói o modelo MILP no formato LP (CPLEX)
 * 
 * O formato LP é um formato de texto legível que define:
 * - Função objetivo (MINIMIZE/MAXIMIZE)
 * - Restrições (SUBJECT TO)
 * - Limites das variáveis (BOUNDS)
 * - Tipos de variáveis (BINARY/GENERAL)
 */
function buildLpModel(
  input: PlannerInput,
  distanceMatrix: DistanceMatrix,
  indices: VariableIndices,
  unavailableSet: Set<string>
): string {
  const { technicians, clients, month_days } = input;
  const numT = technicians.length;
  const numC = clients.length;
  const numD = month_days;

  const lines: string[] = [];

  // ========================================
  // FUNÇÃO OBJETIVO
  // ========================================
  lines.push('MINIMIZE');
  
  const objectiveTerms: string[] = [];
  
  // Termo de distância: Σ x[t,c,d] * distance[t,c]
  for (let t = 0; t < numT; t++) {
    for (let c = 0; c < numC; c++) {
      const dist = distanceMatrix.matrix[t][c];
      for (let d = 0; d < numD; d++) {
        const key = xKey(t, c, d);
        const varIdx = indices.x.get(key);
        if (varIdx !== undefined) {
          // Usar distância arredondada (km) para evitar problemas numéricos
          const coef = Math.round(dist);
          if (coef !== 0) {
            objectiveTerms.push(`${coef} x${varIdx}`);
          }
        }
      }
    }
  }

  // Termo de penalidade: M * Σ unmet[c]
  for (let c = 0; c < numC; c++) {
    const varIdx = indices.unmet.get(unmetKey(c));
    if (varIdx !== undefined) {
      objectiveTerms.push(`${UNMET_PENALTY} u${varIdx}`);
    }
  }

  lines.push(' obj: ' + (objectiveTerms.length > 0 ? objectiveTerms.join(' + ') : '0'));

  // ========================================
  // RESTRIÇÕES
  // ========================================
  lines.push('SUBJECT TO');
  let constraintCount = 0;

  // (1) Capacidade diária: Σc x[t,c,d] <= capacity[t]
  for (let t = 0; t < numT; t++) {
    const capacity = technicians[t].daily_capacity;
    for (let d = 0; d < numD; d++) {
      const unavailKey = `${t}_${d}`;
      if (unavailableSet.has(unavailKey)) continue;

      const terms: string[] = [];
      for (let c = 0; c < numC; c++) {
        const key = xKey(t, c, d);
        const varIdx = indices.x.get(key);
        if (varIdx !== undefined) {
          terms.push(`x${varIdx}`);
        }
      }
      
      if (terms.length > 0) {
        // Usar nome sem underscore para compatibilidade com parser HiGHS-JS
        lines.push(` cap${constraintCount++}: ${terms.join(' + ')} <= ${capacity}`);
      }
    }
  }

  // (2) Frequência mensal: Σ(t,d) x[t,c,d] + unmet[c] >= frequency[c]
  for (let c = 0; c < numC; c++) {
    const frequency = clients[c].frequency_per_month;
    if (frequency <= 0) continue;

    const terms: string[] = [];
    for (let t = 0; t < numT; t++) {
      for (let d = 0; d < numD; d++) {
        const key = xKey(t, c, d);
        const varIdx = indices.x.get(key);
        if (varIdx !== undefined) {
          terms.push(`x${varIdx}`);
        }
      }
    }

    // Adicionar variável unmet
    const unmetIdx = indices.unmet.get(unmetKey(c));
    if (unmetIdx !== undefined) {
      terms.push(`u${unmetIdx}`);
    }

    if (terms.length > 0) {
      lines.push(` freq${constraintCount++}: ${terms.join(' + ')} >= ${frequency}`);
    }
  }

  // (3) Uma visita por dia: Σt x[t,c,d] <= 1
  for (let c = 0; c < numC; c++) {
    for (let d = 0; d < numD; d++) {
      const terms: string[] = [];
      for (let t = 0; t < numT; t++) {
        const key = xKey(t, c, d);
        const varIdx = indices.x.get(key);
        if (varIdx !== undefined) {
          terms.push(`x${varIdx}`);
        }
      }
      
      if (terms.length > 1) {
        lines.push(` one${constraintCount++}: ${terms.join(' + ')} <= 1`);
      }
    }
  }

  // ========================================
  // LIMITES DAS VARIÁVEIS
  // ========================================
  lines.push('BOUNDS');
  
  // Variáveis x são binárias (0-1), limites implícitos na seção BINARY
  
  // Variáveis unmet têm limite superior = frequency do cliente
  for (let c = 0; c < numC; c++) {
    const varIdx = indices.unmet.get(unmetKey(c));
    if (varIdx !== undefined) {
      const maxUnmet = clients[c].frequency_per_month;
      lines.push(` 0 <= u${varIdx} <= ${maxUnmet}`);
    }
  }

  // ========================================
  // TIPOS DE VARIÁVEIS
  // ========================================

  // Variáveis binárias x[t,c,d] - IMPORTANTE: manter tudo em uma única linha
  // O parser do highs-js tem bugs com múltiplas linhas na seção BINARY
  const binaryVars = Array.from(indices.x.values()).map(i => `x${i}`);
  if (binaryVars.length > 0) {
    lines.push('BINARY');
    lines.push(' ' + binaryVars.join(' '));
  }

  // Variáveis inteiras unmet[c] - usar prefixo diferente para evitar conflito
  const generalVars = Array.from(indices.unmet.values()).map(i => `u${i}`);
  if (generalVars.length > 0) {
    lines.push('GENERAL');
    lines.push(' ' + generalVars.join(' '));
  }

  lines.push('END');

  return lines.join('\n');
}

/**
 * Extrai a solução do solver e converte para o formato de saída
 * Usa Map por nome de variável para suportar prefixos 'x' e 'u'
 */
function extractSolutionFromMap(
  solutionMap: Map<string, number>,
  input: PlannerInput,
  indices: VariableIndices,
  distanceMatrix: DistanceMatrix,
  status: string,
  solveTimeMs: number
): PlannerOutput {
  const { technicians, clients, month_days } = input;
  const numT = technicians.length;
  const numC = clients.length;
  const numD = month_days;

  // Inicializar estrutura by_day
  const byDay: Record<string, DayAssignment[]> = {};
  for (let d = 0; d < numD; d++) {
    const dayNum = (d + 1).toString();
    byDay[dayNum] = technicians.map(t => ({
      technician: t.id,
      clients: []
    }));
  }

  // Calcular distância total e popular by_day
  let totalDistance = 0;

  for (let t = 0; t < numT; t++) {
    for (let c = 0; c < numC; c++) {
      for (let d = 0; d < numD; d++) {
        const key = xKey(t, c, d);
        const varIdx = indices.x.get(key);
        if (varIdx !== undefined) {
          const varName = `x${varIdx}`;
          const value = solutionMap.get(varName) || 0;
          if (value > 0.5) {
            // Cliente alocado
            const dayNum = (d + 1).toString();
            const assignment = byDay[dayNum].find(a => a.technician === technicians[t].id);
            if (assignment) {
              assignment.clients.push(clients[c].id);
            }
            totalDistance += distanceMatrix.matrix[t][c];
          }
        }
      }
    }
  }

  // Identificar clientes com demanda não atendida
  const unmetClients: string[] = [];
  const unmetDetails: Record<string, { required: number; scheduled: number }> = {};

  for (let c = 0; c < numC; c++) {
    const varIdx = indices.unmet.get(unmetKey(c));
    if (varIdx !== undefined) {
      const varName = `u${varIdx}`;
      const value = solutionMap.get(varName) || 0;
      if (value > 0.5) {
        const unmetCount = Math.round(value);
        unmetClients.push(clients[c].id);
        unmetDetails[clients[c].id] = {
          required: clients[c].frequency_per_month,
          scheduled: clients[c].frequency_per_month - unmetCount
        };
      }
    }
  }

  // Remover atribuições vazias para compactar output
  for (const dayNum of Object.keys(byDay)) {
    byDay[dayNum] = byDay[dayNum].filter(a => a.clients.length > 0);
  }

  return {
    by_day: byDay,
    unmet_clients: unmetClients,
    unmet_details: Object.keys(unmetDetails).length > 0 ? unmetDetails : undefined,
    statistics: {
      total_distance: Math.round(totalDistance * 100) / 100, // Distância em km com 2 decimais
      model_status: status,
      solve_time_ms: solveTimeMs,
      num_variables: indices.totalVars,
      num_constraints: 0, // Será atualizado se necessário
    }
  };
}

/**
 * Cria set de dias indisponíveis por técnico
 */
function createUnavailableSet(
  technicians: { id: string; unavailable_days: number[] }[]
): Set<string> {
  const set = new Set<string>();
  technicians.forEach((tech, techIndex) => {
    for (const day of tech.unavailable_days) {
      // day é 1-indexed, converter para 0-indexed
      set.add(`${techIndex}_${day - 1}`);
    }
  });
  return set;
}

/**
 * Resolve o modelo MILP e retorna a solução
 */
export async function solveMilpModel(input: PlannerInput): Promise<PlannerOutput> {
  const startTime = Date.now();

  // Validar entrada
  if (input.technicians.length === 0) {
    throw new Error('Nenhum técnico fornecido');
  }
  if (input.clients.length === 0) {
    return {
      by_day: {},
      unmet_clients: [],
      statistics: {
        total_distance: 0,
        model_status: 'OPTIMAL',
        solve_time_ms: Date.now() - startTime
      }
    };
  }
  if (input.month_days <= 0) {
    throw new Error('Número de dias deve ser maior que zero');
  }

  // Construir matriz de distâncias
  const distanceMatrix = input.distance_matrix
    ? {
        matrix: input.distance_matrix,
        technicianIds: input.technicians.map(t => t.id),
        clientIds: input.clients.map(c => c.id)
      }
    : buildDistanceMatrix(input.technicians, input.clients);

  // Criar set de indisponibilidades
  const unavailableSet = createUnavailableSet(input.technicians);

  // Criar índices de variáveis
  const indices = createVariableIndices(
    input.technicians.length,
    input.clients.length,
    input.month_days,
    unavailableSet
  );

  // Construir modelo LP
  const lpModel = buildLpModel(input, distanceMatrix, indices, unavailableSet);

  try {
    // Debug: salvar modelo para verificação
    if (process.env.DEBUG_MILP) {
      console.log('=== MODELO LP ===');
      console.log(lpModel);
      console.log('=================');
    }

    // Resolver usando HiGHS
    const highsSolver = await getHighsSolver();
    
    // Usar mesmas opções que funcionam no simple-test
    const result = highsSolver.solve(lpModel);

    const solveTimeMs = Date.now() - startTime;

    // Mapear status do HiGHS
    let status: string;
    switch (result.Status) {
      case 'Optimal':
        status = 'OPTIMAL';
        break;
      case 'Infeasible':
        status = 'INFEASIBLE';
        break;
      case 'Unbounded':
        status = 'UNBOUNDED';
        break;
      default:
        status = result.Status || 'UNKNOWN';
    }

    // Extrair valores das variáveis em um Map por nome
    const solutionMap = new Map<string, number>();
    if (result.Columns) {
      for (const [varName, varData] of Object.entries(result.Columns)) {
        solutionMap.set(varName, (varData as { Primal: number }).Primal || 0);
      }
    }

    return extractSolutionFromMap(
      solutionMap,
      input,
      indices,
      distanceMatrix,
      status,
      solveTimeMs
    );
  } catch (error) {
    const solveTimeMs = Date.now() - startTime;
    console.error('Erro ao resolver modelo MILP:', error);
    
    // Retornar resultado com erro
    return {
      by_day: {},
      unmet_clients: input.clients.map(c => c.id),
      unmet_details: Object.fromEntries(
        input.clients.map(c => [c.id, { required: c.frequency_per_month, scheduled: 0 }])
      ),
      statistics: {
        total_distance: 0,
        model_status: 'ERROR',
        solve_time_ms: solveTimeMs
      }
    };
  }
}

/**
 * Formata a solução para exibição legível
 */
export function formatSolutionForDisplay(output: PlannerOutput): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('RESULTADO DO PLANEJAMENTO MILP');
  lines.push('='.repeat(60));
  lines.push('');
  
  lines.push(`Status: ${output.statistics.model_status}`);
  lines.push(`Distância Total: ${output.statistics.total_distance.toFixed(2)} km`);
  lines.push(`Tempo de Resolução: ${output.statistics.solve_time_ms} ms`);
  lines.push('');

  if (output.unmet_clients.length > 0) {
    lines.push('⚠️  DEMANDA NÃO ATENDIDA:');
    for (const clientId of output.unmet_clients) {
      const details = output.unmet_details?.[clientId];
      if (details) {
        lines.push(`   - ${clientId}: ${details.scheduled}/${details.required} visitas agendadas`);
      } else {
        lines.push(`   - ${clientId}`);
      }
    }
    lines.push('');
  }

  lines.push('CRONOGRAMA POR DIA:');
  lines.push('-'.repeat(40));
  
  const sortedDays = Object.keys(output.by_day)
    .map(d => parseInt(d))
    .sort((a, b) => a - b);

  for (const day of sortedDays) {
    const dayStr = day.toString();
    const assignments = output.by_day[dayStr];
    if (assignments && assignments.length > 0) {
      lines.push(`\nDia ${day}:`);
      for (const assignment of assignments) {
        lines.push(`  ${assignment.technician}: [${assignment.clients.join(', ')}]`);
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

