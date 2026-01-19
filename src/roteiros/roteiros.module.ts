import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roteiro } from './roteiros.entity';
import { RoteirosService } from './roteiros.service';
import { RoteirosController } from './roteiros.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Roteiro]), AuthModule],
  providers: [RoteirosService],
  exports: [RoteirosService],
  controllers: [RoteirosController],
})
export class RoteirosModule {}
