import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoteiroCliente } from './roteiro-cliente.entity';
import { RoteiroClienteService } from './roteiro-cliente.service';
import { RoteiroClienteController } from './roteiro-cliente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoteiroCliente])],
  providers: [RoteiroClienteService],
  exports: [RoteiroClienteService],
  controllers: [RoteiroClienteController],
})
export class RoteiroClienteModule {}
