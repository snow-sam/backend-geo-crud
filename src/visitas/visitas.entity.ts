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

@Entity('visitas')
@Index(['clienteId'])
@Index(['tecnicoId'])
@Index(['status'])
@Index(['dataAgendamento'])
export class Visita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clienteId: string;

  @Column()
  tecnicoId: string;

  @Column({ type: 'timestamp' })
  dataAgendamento: Date;

  @Column({ default: 'pendente' })
  status: string;

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
}
