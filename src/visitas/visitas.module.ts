import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visita } from './visitas.entity';
import { VisitasService } from './visitas.service';
import { VisitasController } from './visitas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Visita]), AuthModule],
  providers: [VisitasService],
  exports: [VisitasService],
  controllers: [VisitasController],
})
export class VisitasModule {}
