import {
  Index,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Visita } from '../visitas/visitas.entity';
import { Chamado } from '../chamados/chamados.entity';
import { Workspace } from '../workspaces/workspace.entity';

export enum ClientePrioridade {
    BAIXA = 0,
    MEDIA = 1,
    ALTA = 2
}


@Index(['nome'])
@Index(['email'])
@Index(['workspaceId'])
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column()
  nome: string;

  @Column()
  endereco: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column({ default: 1 })
  visitasMensais: number;

  @Column({ default: 60 })
  duracaoMediaMinutos: number;

  @Column({ type: 'time', default: '08:00' })
  horaAbertura: string;

  @Column({ type: 'time', default: '18:00' })
  horaFechamento: string;

  @Column({
        type: "enum",
        enum: ClientePrioridade,
        default: ClientePrioridade.MEDIA
    })
    prioridade: ClientePrioridade;

  @Column({ nullable: true })
  placeId?: string;

  @Column({ nullable: true })
  telefone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  descricao?: string;

  @Column({ type: 'timestamp', nullable: true })
  ultimaVisita?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  atualizadoEm: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletadoEm?: Date;

  @OneToMany(() => Visita, (visita) => visita.cliente)
  visitas: Visita[];

  @OneToMany(() => Chamado, (chamado) => chamado.cliente)
  chamados: Chamado[];
}
