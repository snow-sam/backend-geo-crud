import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chamado } from './chamados.entity';
import { ChamadosService } from './chamados.service';
import { ChamadosController } from './chamados.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chamado]), AuthModule],
  providers: [ChamadosService],
  exports: [ChamadosService],
  controllers: [ChamadosController],
})
export class ChamadosModule {}
