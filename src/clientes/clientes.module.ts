import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './clientes.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente]), GeocodingModule, AuthModule],
  providers: [ClientesService],
  exports: [ClientesService],
  controllers: [ClientesController],
})
export class ClientesModule {}
