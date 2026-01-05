import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('dashboard')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Retorna estatísticas do dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do dashboard',
    type: DashboardStatsDto,
  })
  async getStats(@Req() request: Request): Promise<DashboardStatsDto> {
    const workspaceId = (request as any).workspace.id;
    return this.dashboardService.getStats(workspaceId);
  }
}

