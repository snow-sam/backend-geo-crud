import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chamado } from './chamados.entity';
import { ChamadosService } from './chamados.service';
import { ChamadosController } from './chamados.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chamado])],
  providers: [ChamadosService],
  exports: [ChamadosService],
  controllers: [ChamadosController],
})
export class ChamadosModule {}
