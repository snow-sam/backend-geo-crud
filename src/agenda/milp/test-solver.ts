/**
 * Script de Teste Standalone para o Solver MILP
 * 
 * Este script demonstra o funcionamento do solver com um dataset de teste
 * e pode ser executado diretamente via ts-node ou após compilação.
 * 
 * Execução:
 *   npx ts-node src/agenda/milp/test-solver.ts
 * 
 * ============================================================================
 */

import { solveMilpModel, formatSolutionForDisplay } from './model-builder';
import type { PlannerInput, PlannerOutput } from '../interfaces/planner.interfaces';
import { buildDistanceMatrix, haversineDistance } from '../utils/distance.util';

// ============================================================================
// DATASET DE TESTE
// ============================================================================

/**
 * Dataset pequeno para validação do solver
 * 
 * Cenário: 3 técnicos, 8 clientes, 22 dias úteis
 * - Técnico T1: capacidade 8, algumas indisponibilidades
 * - Técnico T2: capacidade 6
 * - Técnico T3: capacidade 5
 * 
 * Os clientes estão distribuídos geograficamente na região de São Paulo
 * com diferentes frequências de visita.
 */
/**
 * Dataset para validação do solver MILP
 * 
 * Cenário: 2 técnicos, 5 clientes, 10 dias úteis
 * - Técnico T1: capacidade 4, indisponível no dia 5
 * - Técnico T2: capacidade 3, totalmente disponível
 * 
 * Os clientes estão distribuídos geograficamente na região de São Paulo
 * com diferentes frequências de visita e prioridades.
 * 
 * NOTA: Para modelos maiores (produção com muitos técnicos/clientes/dias),
 * considere dividir o problema ou usar soluções alternativas.
 */
const testInput: PlannerInput = {
  technicians: [
    {
      id: 'T1',
      daily_capacity: 4,
      home_lat: -23.55,
      home_lng: -46.63,
      unavailable_days: [5], // Indisponível no dia 5
    },
    {
      id: 'T2',
      daily_capacity: 3,
      home_lat: -23.52,
      home_lng: -46.68,
      unavailable_days: [],
    },
  ],
  clients: [
    {
      id: 'C1',
      lat: -23.51,
      lng: -46.62,
      frequency_per_month: 2,
      priority: 2,
    },
    {
      id: 'C2',
      lat: -23.53,
      lng: -46.64,
      frequency_per_month: 3,
      priority: 1,
    },
    {
      id: 'C3',
      lat: -23.56,
      lng: -46.66,
      frequency_per_month: 2,
      priority: 2,
    },
    {
      id: 'C4',
      lat: -23.54,
      lng: -46.70,
      frequency_per_month: 1,
      priority: 0,
    },
    {
      id: 'C5',
      lat: -23.50,
      lng: -46.60,
      frequency_per_month: 2,
      priority: 1,
    },
  ],
  month_days: 10,
  working_dates: Array.from({ length: 10 }, (_, i) => {
    const day = i + 1;
    return `2025-01-${day.toString().padStart(2, '0')}`;
  }),
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida a solução verificando todas as restrições
 */
function validateSolution(input: PlannerInput, output: PlannerOutput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const techMap = new Map(input.technicians.map((t, i) => [t.id, { ...t, index: i }]));
  const clientMap = new Map(input.clients.map((c, i) => [c.id, { ...c, index: i }]));

  // Criar set de dias indisponíveis
  const unavailableSet = new Set<string>();
  input.technicians.forEach(tech => {
    tech.unavailable_days.forEach(day => {
      unavailableSet.add(`${tech.id}_${day}`);
    });
  });

  // Contar visitas por cliente
  const visitCountPerClient = new Map<string, number>();
  input.clients.forEach(c => visitCountPerClient.set(c.id, 0));

  // Verificar cada dia
  for (let d = 1; d <= input.month_days; d++) {
    const dayStr = d.toString();
    const dayAssignments = output.by_day[dayStr] || [];

    // Verificar capacidade por técnico
    for (const assignment of dayAssignments) {
      const tech = techMap.get(assignment.technician);
      if (!tech) {
        errors.push(`Técnico desconhecido: ${assignment.technician}`);
        continue;
      }

      // Verificar indisponibilidade
      if (unavailableSet.has(`${tech.id}_${d}`)) {
        errors.push(
          `Técnico ${tech.id} alocado no dia ${d} mas está indisponível`
        );
      }

      // Verificar capacidade
      if (assignment.clients.length > tech.daily_capacity) {
        errors.push(
          `Técnico ${tech.id} excedeu capacidade no dia ${d}: ` +
          `${assignment.clients.length} > ${tech.daily_capacity}`
        );
      }

      // Contar visitas
      for (const clientId of assignment.clients) {
        const count = visitCountPerClient.get(clientId) || 0;
        visitCountPerClient.set(clientId, count + 1);
      }
    }

    // Verificar se cliente foi visitado mais de uma vez no mesmo dia
    const clientsVisitedToday = new Set<string>();
    for (const assignment of dayAssignments) {
      for (const clientId of assignment.clients) {
        if (clientsVisitedToday.has(clientId)) {
          errors.push(`Cliente ${clientId} visitado múltiplas vezes no dia ${d}`);
        }
        clientsVisitedToday.add(clientId);
      }
    }
  }

  // Verificar frequência por cliente
  for (const client of input.clients) {
    const visits = visitCountPerClient.get(client.id) || 0;
    const unmetCount = output.unmet_clients.includes(client.id)
      ? (output.unmet_details?.[client.id]?.required || client.frequency_per_month) -
        (output.unmet_details?.[client.id]?.scheduled || 0)
      : 0;

    if (visits + unmetCount < client.frequency_per_month) {
      errors.push(
        `Cliente ${client.id}: frequência não atingida ` +
        `(${visits} visitas, ${unmetCount} não atendidas, requerido: ${client.frequency_per_month})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Imprime estatísticas da matriz de distâncias
 */
function printDistanceStats(input: PlannerInput): void {
  const distMatrix = buildDistanceMatrix(input.technicians, input.clients);
  
  console.log('\n📍 MATRIZ DE DISTÂNCIAS (km):');
  console.log('-'.repeat(60));
  
  // Header
  const header = ['Tech\\Client', ...input.clients.map(c => c.id.padStart(8))];
  console.log(header.join(' '));
  
  // Rows
  for (let t = 0; t < input.technicians.length; t++) {
    const row = [
      input.technicians[t].id.padEnd(11),
      ...distMatrix.matrix[t].map(d => d.toFixed(2).padStart(8)),
    ];
    console.log(row.join(' '));
  }

  // Estatísticas
  let minDist = Infinity;
  let maxDist = 0;
  let sumDist = 0;
  let count = 0;

  for (const row of distMatrix.matrix) {
    for (const d of row) {
      minDist = Math.min(minDist, d);
      maxDist = Math.max(maxDist, d);
      sumDist += d;
      count++;
    }
  }

  console.log('-'.repeat(60));
  console.log(`Distância mínima: ${minDist.toFixed(2)} km`);
  console.log(`Distância máxima: ${maxDist.toFixed(2)} km`);
  console.log(`Distância média: ${(sumDist / count).toFixed(2)} km`);
}

/**
 * Imprime resumo da demanda vs capacidade
 */
function printCapacitySummary(input: PlannerInput): void {
  console.log('\n📊 RESUMO DE CAPACIDADE:');
  console.log('-'.repeat(60));

  const totalDemand = input.clients.reduce((sum, c) => sum + c.frequency_per_month, 0);
  
  let totalCapacity = 0;
  for (const tech of input.technicians) {
    const availableDays = input.month_days - tech.unavailable_days.length;
    const techCapacity = availableDays * tech.daily_capacity;
    totalCapacity += techCapacity;
    console.log(
      `${tech.id}: ${tech.daily_capacity}/dia × ${availableDays} dias = ${techCapacity} visitas`
    );
  }

  console.log('-'.repeat(60));
  console.log(`Demanda total: ${totalDemand} visitas`);
  console.log(`Capacidade total: ${totalCapacity} visitas`);
  console.log(`Margem: ${((totalCapacity / totalDemand - 1) * 100).toFixed(1)}%`);
  
  if (totalCapacity < totalDemand) {
    console.log('⚠️  ALERTA: Capacidade insuficiente para atender toda a demanda!');
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function run(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🔧 TESTE DO SOLVER MILP - PLANEJAMENTO DE VISITAS TÉCNICAS');
  console.log('='.repeat(60));

  // Mostrar entrada
  console.log('\n📋 ENTRADA DO TESTE:');
  console.log(`- Técnicos: ${testInput.technicians.length}`);
  console.log(`- Clientes: ${testInput.clients.length}`);
  console.log(`- Dias úteis: ${testInput.month_days}`);

  // Mostrar estatísticas de distância
  printDistanceStats(testInput);

  // Mostrar resumo de capacidade
  printCapacitySummary(testInput);

  // Resolver
  console.log('\n⏳ Resolvendo modelo MILP...');
  const startTime = Date.now();
  
  let output: PlannerOutput;
  try {
    output = await solveMilpModel(testInput);
  } catch (error) {
    console.error('❌ Erro ao resolver modelo:', error);
    return;
  }

  const elapsed = Date.now() - startTime;
  console.log(`✅ Resolvido em ${elapsed}ms`);

  // Mostrar resultado formatado
  console.log('\n' + formatSolutionForDisplay(output));

  // Validar solução
  console.log('\n🔍 VALIDAÇÃO DA SOLUÇÃO:');
  console.log('-'.repeat(60));
  const validation = validateSolution(testInput, output);
  
  if (validation.valid) {
    console.log('✅ Todas as restrições satisfeitas!');
  } else {
    console.log('❌ Problemas encontrados:');
    validation.errors.forEach(err => console.log(`   - ${err}`));
  }

  // Mostrar output JSON
  console.log('\n📤 OUTPUT JSON (para integração com Fleet Routing):');
  console.log('-'.repeat(60));
  console.log(JSON.stringify(output, null, 2));
}

// Executar se chamado diretamente
run().catch(console.error);

