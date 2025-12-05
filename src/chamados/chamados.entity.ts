import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Cliente } from '../clientes/clientes.entity';
import { Tecnico } from '../tecnicos/tecnicos.entity';

@Entity('chamados')
@Index(['status'])
@Index(['dataAbertura'])
@Index(['prazoAtendimento'])
@Index(['clienteId'])
@Index(['tecnicoId'])
@Index(['local'])
@Index(['tipo'])
export class Chamado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  local: string;

  @Column()
  tipo: string;

  @Column()
  descricao: string;

  @Column({ type: 'timestamp' })
  dataAbertura: Date;

  @Column({ type: 'timestamp', nullable: true })
  prazoAtendimento?: Date;

  @Column({ default: 'aberto' })
  status: string;

  @Column({ nullable: true })
  clienteId?: string;

  @Column({ nullable: true })
  tecnicoId?: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @DeleteDateColumn()
  deletadoEm?: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.chamados, { onDelete: 'SET NULL' })
  cliente?: Cliente;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.chamados, { onDelete: 'SET NULL' })
  tecnico?: Tecnico;
}
