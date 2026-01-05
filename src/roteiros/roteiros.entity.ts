import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Tecnico } from '../tecnicos/tecnicos.entity';
import type { Visita } from '../visitas/visitas.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('roteiros')
@Index(['tecnicoId'])
@Index(['data'])
@Index(['status'])
@Index(['workspaceId'])
export class Roteiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  tecnicoId: string;

  @Column({ type: 'timestamp' })
  data: Date;

  @Column({ default: 'PLANNED' })
  status: string;

  @Column({ type: 'float', nullable: true })
  distanciaTotal?: number;

  @Column({ type: 'int', nullable: true })
  tempoEstimado?: number;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @DeleteDateColumn()
  deletadoEm?: Date;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.roteiros, { onDelete: 'CASCADE' })
  tecnico: Tecnico;

  @OneToMany('Visita', 'roteiro')
  visitas: Visita[];
}
