/**
 * Utilitários de Cálculo de Distância para o Solver MILP
 * 
 * Fornece funções para calcular distâncias geográficas usando a fórmula
 * de Haversine e construir matrizes de distância técnico-cliente.
 * 
 * A arquitetura modular permite fácil substituição por Distance Matrix API
 * do Google Maps no futuro.
 */

import type { TechnicianInput, ClientInput } from '../interfaces/planner.interfaces';

// Raio médio da Terra em quilômetros
const EARTH_RADIUS_KM = 6371;

/**
 * Converte graus para radianos
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * 
 * A fórmula de Haversine calcula a distância do grande círculo entre dois pontos
 * em uma esfera dado suas latitudes e longitudes.
 * 
 * @param lat1 - Latitude do primeiro ponto em graus
 * @param lng1 - Longitude do primeiro ponto em graus
 * @param lat2 - Latitude do segundo ponto em graus
 * @param lng2 - Longitude do segundo ponto em graus
 * @returns Distância em quilômetros
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  
  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * 
    Math.cos(lat1Rad) * Math.cos(lat2Rad);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Interface para o resultado da matriz de distâncias
 */
export interface DistanceMatrix {
  /** Matriz de distâncias [técnico][cliente] em km */
  matrix: number[][];
  /** IDs dos técnicos na ordem das linhas */
  technicianIds: string[];
  /** IDs dos clientes na ordem das colunas */
  clientIds: string[];
}

/**
 * Constrói matriz de distâncias entre técnicos e clientes
 * 
 * A matriz resultante tem dimensões [numTechnicians][numClients] onde
 * matrix[t][c] representa a distância da casa do técnico t até o cliente c.
 * 
 * @param technicians - Lista de técnicos com suas coordenadas
 * @param clients - Lista de clientes com suas coordenadas
 * @returns Objeto contendo a matriz e mapeamentos de IDs
 */
export function buildDistanceMatrix(
  technicians: TechnicianInput[],
  clients: ClientInput[]
): DistanceMatrix {
  const matrix: number[][] = [];
  const technicianIds: string[] = [];
  const clientIds: string[] = clients.map(c => c.id);

  for (const tech of technicians) {
    technicianIds.push(tech.id);
    const row: number[] = [];
    
    for (const client of clients) {
      const distance = haversineDistance(
        tech.home_lat,
        tech.home_lng,
        client.lat,
        client.lng
      );
      row.push(distance);
    }
    
    matrix.push(row);
  }

  return { matrix, technicianIds, clientIds };
}

/**
 * Obtém distância da matriz por IDs
 * 
 * @param distanceMatrix - Objeto da matriz de distâncias
 * @param technicianId - ID do técnico
 * @param clientId - ID do cliente
 * @returns Distância em km ou undefined se não encontrado
 */
export function getDistanceFromMatrix(
  distanceMatrix: DistanceMatrix,
  technicianId: string,
  clientId: string
): number | undefined {
  const techIndex = distanceMatrix.technicianIds.indexOf(technicianId);
  const clientIndex = distanceMatrix.clientIds.indexOf(clientId);
  
  if (techIndex === -1 || clientIndex === -1) {
    return undefined;
  }
  
  return distanceMatrix.matrix[techIndex][clientIndex];
}

/**
 * Calcula a distância total de uma rota
 * 
 * A rota começa na casa do técnico, visita os clientes na ordem dada,
 * e retorna à casa do técnico.
 * 
 * @param technician - Técnico realizando a rota
 * @param clients - Lista de clientes a visitar (na ordem)
 * @returns Distância total da rota em km
 */
export function calculateRouteDistance(
  technician: TechnicianInput,
  clients: ClientInput[]
): number {
  if (clients.length === 0) {
    return 0;
  }

  let totalDistance = 0;
  let currentLat = technician.home_lat;
  let currentLng = technician.home_lng;

  // Visitar cada cliente
  for (const client of clients) {
    totalDistance += haversineDistance(currentLat, currentLng, client.lat, client.lng);
    currentLat = client.lat;
    currentLng = client.lng;
  }

  // Retornar à base
  totalDistance += haversineDistance(
    currentLat,
    currentLng,
    technician.home_lat,
    technician.home_lng
  );

  return totalDistance;
}

/**
 * Calcula distância mínima entre um cliente e qualquer técnico
 * 
 * Útil para estimar custos e priorizar alocações.
 * 
 * @param client - Cliente
 * @param technicians - Lista de técnicos
 * @returns Objeto com distância mínima e ID do técnico mais próximo
 */
export function findNearestTechnician(
  client: ClientInput,
  technicians: TechnicianInput[]
): { distance: number; technicianId: string } | null {
  if (technicians.length === 0) {
    return null;
  }

  let minDistance = Infinity;
  let nearestId = '';

  for (const tech of technicians) {
    const dist = haversineDistance(
      tech.home_lat,
      tech.home_lng,
      client.lat,
      client.lng
    );
    
    if (dist < minDistance) {
      minDistance = dist;
      nearestId = tech.id;
    }
  }

  return { distance: minDistance, technicianId: nearestId };
}

/**
 * Estima distância média por visita usando a matriz
 * 
 * Útil para estatísticas e validações.
 * 
 * @param distanceMatrix - Matriz de distâncias
 * @returns Distância média em km
 */
export function calculateAverageDistance(distanceMatrix: DistanceMatrix): number {
  let sum = 0;
  let count = 0;

  for (const row of distanceMatrix.matrix) {
    for (const dist of row) {
      sum += dist;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

