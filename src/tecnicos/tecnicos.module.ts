import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tecnico } from './tecnicos.entity';
import { TecnicosService } from './tecnicos.service';
import { TecnicosController } from './tecnicos.controller';
import { TecnicoPortalController } from './tecnico-portal.controller';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { User } from '../users/user.entity';
import { Roteiro } from '../roteiros/roteiros.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tecnico, User, Roteiro, Workspace]),
    GeocodingModule,
  ],
  providers: [TecnicosService],
  exports: [TecnicosService],
  controllers: [TecnicosController, TecnicoPortalController],
})
export class TecnicosModule {}
