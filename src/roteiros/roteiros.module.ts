import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roteiro } from './roteiros.entity';
import { RoteirosService } from './roteiros.service';
import { RoteirosController } from './roteiros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Roteiro])],
  providers: [RoteirosService],
  exports: [RoteirosService],
  controllers: [RoteirosController],
})
export class RoteirosModule {}
