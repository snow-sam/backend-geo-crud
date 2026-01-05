import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de clientes cadastrados' })
  totalClientes: number;

  @ApiProperty({ description: 'Total de técnicos ativos' })
  tecnicosAtivos: number;

  @ApiProperty({ description: 'Total de visitas agendadas (pendentes)' })
  visitasAgendadas: number;

  @ApiProperty({ description: 'Total de chamados abertos' })
  chamadosAbertos: number;
}

