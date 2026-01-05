/**
 * FleetRoutingService - Serviço de Roteirização Diária
 *
 * Utiliza a Google Cloud Route Optimization API (Fleet Routing) para
 * otimizar a ordem das visitas de cada técnico em um dia específico.
 *
 * Documentação da API:
 * https://cloud.google.com/optimization/docs/reference/rest
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import type { Cliente } from '../clientes/clientes.entity';
import type { Tecnico } from '../tecnicos/tecnicos.entity';

// ============================================================================
// INTERFACES DA API
// ============================================================================

interface LatLng {
  latitude: number;
  longitude: number;
}

interface TimeWindow {
  startTime: string; // RFC3339 timestamp
  endTime: string;
}

interface Shipment {
  deliveries: Array<{
    arrivalLocation: LatLng;
    duration: string; // formato "Xs" (ex: "3600s")
    timeWindows?: TimeWindow[];
  }>;
  label?: string;
}

interface Vehicle {
  startLocation: LatLng;
  label?: string;
  travelMode?: 'DRIVING' | 'WALKING';
}

interface OptimizeToursRequest {
  parent: string;
  model: {
    shipments: Shipment[];
    vehicles: Vehicle[];
    globalStartTime: string;
    globalEndTime: string;
  };
}

interface Visit {
  shipmentIndex?: number;
  shipmentLabel?: string;
  startTime: string;
  detour?: string;
}

interface ShipmentRoute {
  vehicleIndex: number;
  visits: Visit[];
  routePolyline?: { points: string };
  metrics?: {
    performedShipmentCount: number;
    travelDuration: string;
    travelDistanceMeters: number;
  };
}

interface OptimizeToursResponse {
  routes: ShipmentRoute[];
  metrics?: {
    totalCost: number;
    usedVehicleCount: number;
  };
}

// ============================================================================
// INTERFACES DE SAÍDA DO SERVIÇO
// ============================================================================

export interface VisitaOrdenada {
  cliente: Cliente;
  ordem: number;
  estimativaChegada: Date;
  distanciaProximoKM?: number;
  tempoProximoMinutos?: number;
}

export interface RoteiroOtimizado {
  tecnico: Tecnico;
  visitas: VisitaOrdenada[];
  distanciaTotalKM: number;
  tempoTotalMinutos: number;
}

export interface ResultadoRoteirizacao {
  data: string;
  roteiros: RoteiroOtimizado[];
  sucessoTotal: boolean;
  erros?: string[];
}

// ============================================================================
// SERVIÇO
// ============================================================================

@Injectable()
export class FleetRoutingService {
  private readonly logger = new Logger(FleetRoutingService.name);
  private readonly apiEndpoint =
    'https://routeoptimization.googleapis.com/v1';
  private auth: GoogleAuth;
  private projectId: string;

  constructor(private configService: ConfigService) {
    this.projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT', '');

    // Inicializa autenticação com Application Default Credentials
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  /**
   * Gera roteiros otimizados para um dia específico
   *
   * @param data - Data no formato YYYY-MM-DD
   * @param visitasPorTecnico - Map de técnico para lista de clientes a visitar
   * @returns Roteiros otimizados para cada técnico
   */
  async gerarRoteiros(
    data: string,
    visitasPorTecnico: Map<Tecnico, Cliente[]>,
  ): Promise<ResultadoRoteirizacao> {
    const roteiros: RoteiroOtimizado[] = [];
    const erros: string[] = [];

    for (const [tecnico, clientes] of visitasPorTecnico) {
      if (clientes.length === 0) continue;

      try {
        const roteiro = await this.otimizarRotaTecnico(data, tecnico, clientes);
        roteiros.push(roteiro);
      } catch (error) {
        const mensagem = `Erro ao otimizar rota do técnico ${tecnico.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        this.logger.error(mensagem);
        erros.push(mensagem);

        // Fallback: manter ordem original
        roteiros.push(this.criarRoteiroSemOtimizacao(data, tecnico, clientes));
      }
    }

    return {
      data,
      roteiros,
      sucessoTotal: erros.length === 0,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  /**
   * Otimiza a rota de um técnico específico usando a API
   */
  private async otimizarRotaTecnico(
    data: string,
    tecnico: Tecnico,
    clientes: Cliente[],
  ): Promise<RoteiroOtimizado> {
    // Se só tem 1 cliente, não precisa otimizar via API
    if (clientes.length === 1) {
      return this.criarRoteiroSemOtimizacao(data, tecnico, clientes);
    }

    const request = this.montarRequisicao(data, tecnico, clientes);
    const response = await this.chamarApi(request);

    return this.parsearResposta(data, tecnico, clientes, response);
  }

  /**
   * Monta a requisição para a Route Optimization API
   */
  private montarRequisicao(
    data: string,
    tecnico: Tecnico,
    clientes: Cliente[],
  ): OptimizeToursRequest {
    // Horários globais do dia de trabalho (8h às 18h)
    const globalStartTime = `${data}T08:00:00Z`;
    const globalEndTime = `${data}T18:00:00Z`;

    // Criar shipments (entregas/visitas)
    const shipments: Shipment[] = clientes.map((cliente) => {
      const timeWindows: TimeWindow[] = [];

      // Adicionar janela de tempo se o cliente tiver horários definidos
      if (cliente.horaAbertura && cliente.horaFechamento) {
        timeWindows.push({
          startTime: `${data}T${this.formatarHorario(cliente.horaAbertura)}Z`,
          endTime: `${data}T${this.formatarHorario(cliente.horaFechamento)}Z`,
        });
      }

      return {
        deliveries: [
          {
            arrivalLocation: {
              latitude: cliente.latitude,
              longitude: cliente.longitude,
            },
            duration: `${cliente.duracaoMediaMinutos * 60}s`,
            ...(timeWindows.length > 0 && { timeWindows }),
          },
        ],
        label: cliente.id,
      };
    });

    // Criar veículo (técnico)
    const vehicles: Vehicle[] = [
      {
        startLocation: {
          latitude: tecnico.latitude,
          longitude: tecnico.longitude,
        },
        label: tecnico.id,
        travelMode: 'DRIVING',
      },
    ];

    return {
      parent: `projects/${this.projectId}`,
      model: {
        shipments,
        vehicles,
        globalStartTime,
        globalEndTime,
      },
    };
  }

  /**
   * Chama a Route Optimization API
   */
  private async chamarApi(
    request: OptimizeToursRequest,
  ): Promise<OptimizeToursResponse> {
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Não foi possível obter token de acesso do Google Cloud');
    }

    const url = `${this.apiEndpoint}/${request.parent}:optimizeTours`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Erro na API Fleet Routing: ${response.status} - ${errorBody}`);
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<OptimizeToursResponse>;
  }

  /**
   * Parseia a resposta da API e retorna o roteiro otimizado
   */
  private parsearResposta(
    data: string,
    tecnico: Tecnico,
    clientes: Cliente[],
    response: OptimizeToursResponse,
  ): RoteiroOtimizado {
    const route = response.routes[0];

    if (!route || !route.visits || route.visits.length === 0) {
      this.logger.warn(`API não retornou rota válida para técnico ${tecnico.nome}`);
      return this.criarRoteiroSemOtimizacao(data, tecnico, clientes);
    }

    // Cria mapa de label (cliente.id) para cliente para busca alternativa
    const clientesPorId = new Map(clientes.map((c, idx) => [c.id, { cliente: c, index: idx }]));

    const visitas: VisitaOrdenada[] = route.visits
      .map((visit: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Tenta encontrar o cliente pelo shipmentIndex ou pelo shipmentLabel
        let cliente: Cliente | undefined;
        
        if (typeof visit.shipmentIndex === 'number') {
          cliente = clientes[visit.shipmentIndex];
        } else if (visit.shipmentLabel) {
          // Fallback: busca pelo label (que é o ID do cliente)
          cliente = clientesPorId.get(visit.shipmentLabel)?.cliente;
        }
        
        // Se não encontrou o cliente, pula essa visita
        if (!cliente) {
          this.logger.warn(`Cliente não encontrado - shipmentIndex: ${visit.shipmentIndex}, shipmentLabel: ${visit.shipmentLabel}`);
          return null;
        }

        const estimativaChegada = new Date(visit.startTime);

        return {
          cliente,
          ordem: 0, // Será recalculado após filtro
          estimativaChegada,
        };
      })
      .filter((v): v is VisitaOrdenada => v !== null)
      .map((visita, index) => ({
        ...visita,
        ordem: index + 1, // Renumera sequencialmente após filtro
      }));

    // Calcular métricas
    const distanciaTotalKM = route.metrics?.travelDistanceMeters
      ? route.metrics.travelDistanceMeters / 1000
      : 0;

    const tempoTotalMinutos = route.metrics?.travelDuration
      ? parseInt(route.metrics.travelDuration.replace('s', '')) / 60
      : 0;

    return {
      tecnico,
      visitas,
      distanciaTotalKM,
      tempoTotalMinutos,
    };
  }

  /**
   * Cria roteiro sem otimização (fallback ou quando só tem 1 cliente)
   * Calcula distâncias usando fórmula de Haversine e estima tempos
   */
  private criarRoteiroSemOtimizacao(
    data: string,
    tecnico: Tecnico,
    clientes: Cliente[],
  ): RoteiroOtimizado {
    const VELOCIDADE_MEDIA_KMH = 40; // Velocidade média em área urbana
    let horarioAtual = new Date(`${data}T08:00:00`);
    let distanciaTotalKM = 0;
    let tempoDeslocamentoTotal = 0;

    // Ponto de partida é a localização do técnico
    let latAtual = tecnico.latitude;
    let lngAtual = tecnico.longitude;

    const visitas: VisitaOrdenada[] = clientes.map((cliente, index) => {
      // Calcula distância do ponto atual até o cliente
      const distanciaKM = this.calcularDistanciaHaversine(
        latAtual,
        lngAtual,
        cliente.latitude,
        cliente.longitude,
      );

      // Tempo de deslocamento em minutos
      const tempoDeslocamentoMin = (distanciaKM / VELOCIDADE_MEDIA_KMH) * 60;

      // Avança o horário considerando deslocamento
      horarioAtual = new Date(horarioAtual.getTime() + tempoDeslocamentoMin * 60 * 1000);
      const estimativaChegada = new Date(horarioAtual);

      // Avança o horário considerando a duração da visita
      horarioAtual = new Date(
        horarioAtual.getTime() + cliente.duracaoMediaMinutos * 60 * 1000,
      );

      // Acumula métricas
      distanciaTotalKM += distanciaKM;
      tempoDeslocamentoTotal += tempoDeslocamentoMin;

      // Atualiza posição atual para o próximo cálculo
      latAtual = cliente.latitude;
      lngAtual = cliente.longitude;

      return {
        cliente,
        ordem: index + 1,
        estimativaChegada,
        distanciaProximoKM: Math.round(distanciaKM * 100) / 100,
        tempoProximoMinutos: Math.round(tempoDeslocamentoMin),
      };
    });

    // Tempo total = deslocamento + atendimentos
    const tempoAtendimentoTotal = clientes.reduce(
      (acc, c) => acc + c.duracaoMediaMinutos,
      0,
    );

    return {
      tecnico,
      visitas,
      distanciaTotalKM: Math.round(distanciaTotalKM * 100) / 100,
      tempoTotalMinutos: Math.round(tempoDeslocamentoTotal + tempoAtendimentoTotal),
    };
  }

  /**
   * Calcula distância entre dois pontos usando fórmula de Haversine
   * @returns Distância em quilômetros
   */
  private calcularDistanciaHaversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Formata horário para o padrão HH:mm:ss
   * Aceita formatos: "08:00", "08:00:00", "8:00"
   */
  private formatarHorario(horario: string): string {
    // Remove espaços
    const h = horario.trim();
    
    // Se já tem segundos (HH:mm:ss), retorna como está
    if (/^\d{2}:\d{2}:\d{2}$/.test(h)) {
      return h;
    }
    
    // Se é HH:mm, adiciona segundos
    if (/^\d{1,2}:\d{2}$/.test(h)) {
      const [hora, min] = h.split(':');
      return `${hora.padStart(2, '0')}:${min}:00`;
    }
    
    // Fallback: retorna 08:00:00
    this.logger.warn(`Formato de horário inválido: ${horario}, usando 08:00:00`);
    return '08:00:00';
  }

  /**
   * Verifica se a configuração do Google Cloud está presente
   */
  isConfigured(): boolean {
    return !!this.projectId;
  }

  /**
   * Retorna informações de configuração para debug
   */
  getConfigInfo(): { projectId: string; configured: boolean } {
    return {
      projectId: this.projectId || '(não configurado)',
      configured: this.isConfigured(),
    };
  }
}
