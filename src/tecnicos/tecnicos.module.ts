import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tecnico } from './tecnicos.entity';
import { TecnicosService } from './tecnicos.service';
import { TecnicosController } from './tecnicos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tecnico])],
  providers: [TecnicosService],
  exports: [TecnicosService],
  controllers: [TecnicosController],
})
export class TecnicosModule {}
