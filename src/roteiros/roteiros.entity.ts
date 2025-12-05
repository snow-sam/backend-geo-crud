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
import { RoteiroCliente } from '../roteiro-cliente/roteiro-cliente.entity';

@Entity('roteiros')
@Index(['tecnicoId'])
@Index(['data'])
@Index(['status'])
export class Roteiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @OneToMany(() => RoteiroCliente, (roteiroCliente) => roteiroCliente.roteiro)
  clientes: RoteiroCliente[];
}
