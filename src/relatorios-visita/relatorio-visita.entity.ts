import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Visita } from '../visitas/visitas.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('relatorios_visita')
@Index(['visitaId'])
@Index(['workspaceId'])
export class RelatorioVisita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  visitaId: string;

  @OneToOne(() => Visita, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitaId' })
  visita: Visita;

  @Column({ type: 'int' })
  avaliacao: number;

  @Column({ type: 'text' })
  descricaoGeral: string;

  @Column({ type: 'time' })
  horarioInicio: string;

  @Column({ type: 'time', nullable: true })
  horarioFim: string;

  @Column({ type: 'text', nullable: true })
  observacoesAvaliacao: string;

  @Column({ type: 'text', nullable: true })
  assinaturaCliente: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @DeleteDateColumn()
  deletadoEm?: Date;
}

