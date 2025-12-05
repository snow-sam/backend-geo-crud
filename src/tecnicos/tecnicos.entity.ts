import {
  Index,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Visita } from '../visitas/visitas.entity';
import { Chamado } from '../chamados/chamados.entity';
import { Roteiro } from '../roteiros/roteiros.entity';

@Index(['nome'])
@Index(['email'])
@Index(['placa'])
@Entity('tecnicos')
export class Tecnico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  telefone: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  endereco?: string;

  @Column({ nullable: true })
  placa?: string;

  @Column({ nullable: true })
  especialidade?: string;

  @Column({ default: true })
  eAtivo: boolean;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column({ nullable: true })
  placeId?: string;

  @Column({ default: 10 })
  capacidadeDiaria: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  atualizadoEm: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletadoEm?: Date | null;

  
  @OneToMany(() => Visita, (visita) => visita.tecnico)
  visitas: Visita[];

  @OneToMany(() => Chamado, (chamado) => chamado.tecnico)
  chamados: Chamado[];

  @OneToMany(() => Roteiro, (roteiro) => roteiro.tecnico)
  roteiros: Roteiro[];
}
