import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Roteiro } from '../roteiros/roteiros.entity';
import { Cliente } from '../clientes/clientes.entity';

@Entity('roteiro_clientes')
@Unique(['roteiroId', 'ordem'])
@Index(['roteiroId'])
@Index(['clienteId'])
@Index(['status'])
export class RoteiroCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roteiroId: string;

  @Column()
  clienteId: string;

  @Column({ type: 'int' })
  ordem: number;

  @Column()
  tipo: string; // CALL, PREVENTIVE

  @Column({ default: 'PLANNED' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  estimativaChegada?: Date;

  @Column({ type: 'timestamp', nullable: true })
  realizadoEm?: Date;

  @Column({ type: 'float', nullable: true })
  distanciaProximoKM?: number;

  @Column({ type: 'int', nullable: true })
  distanciaProximoMinutos?: number;

  @CreateDateColumn()
  criadoEm: Date;

  @ManyToOne(() => Roteiro, (r) => r.clientes, { onDelete: 'CASCADE' })
  roteiro: Roteiro;

  @ManyToOne(() => Cliente, (cliente) => cliente.roteiroClientes, { onDelete: 'CASCADE' })
  cliente: Cliente;
}
