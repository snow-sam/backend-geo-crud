import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Cliente } from '../clientes/clientes.entity';
import { Tecnico } from '../tecnicos/tecnicos.entity';
import { Workspace } from '../workspaces/workspace.entity';
import type { Roteiro } from '../roteiros/roteiros.entity';
import type { RelatorioVisita } from '../relatorios-visita/relatorio-visita.entity';

@Entity('visitas')
@Index(['clienteId'])
@Index(['tecnicoId'])
@Index(['status'])
@Index(['dataAgendamento'])
@Index(['workspaceId'])
@Index(['roteiroId'])
export class Visita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  clienteId: string;

  @Column()
  tecnicoId: string;

  @Column({ nullable: true })
  roteiroId?: string;

  @Column({ type: 'timestamp' })
  dataAgendamento: Date;

  @Column({ default: 'pendente' })
  status: string;

  @Column({ nullable: true })
  tipo?: string; // CALL, PREVENTIVE

  @Column({ type: 'int', nullable: true })
  ordem?: number;

  @Column({ type: 'timestamp', nullable: true })
  estimativaChegada?: Date;

  @Column({ type: 'timestamp', nullable: true })
  realizadoEm?: Date;

  @Column({ type: 'float', nullable: true })
  distanciaProximoKM?: number;

  @Column({ type: 'int', nullable: true })
  distanciaProximoMinutos?: number;

  @Column({ nullable: true })
  notas?: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @DeleteDateColumn()
  deletadoEm?: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.visitas, { onDelete: 'CASCADE' })
  cliente: Cliente;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.visitas, { onDelete: 'CASCADE' })
  tecnico: Tecnico;

  @ManyToOne('Roteiro', 'visitas', { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  roteiro?: Roteiro;

  @OneToOne('RelatorioVisita', 'visita')
  relatorioVisita?: RelatorioVisita;
}
