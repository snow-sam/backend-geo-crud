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
import { Workspace } from '../workspaces/workspace.entity';

@Entity('chamados')
@Index(['status'])
@Index(['dataAbertura'])
@Index(['prazoAtendimento'])
@Index(['clienteId'])
@Index(['tecnicoId'])
@Index(['local'])
@Index(['tipo'])
@Index(['workspaceId'])
export class Chamado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Workspace;

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

  // Campos do formulário de abertura
  @Column({ nullable: true })
  nomeEmpresa?: string;

  @Column({ nullable: true })
  nomeFuncao?: string;

  @Column({ nullable: true })
  telefoneContato?: string;

  @Column({ nullable: true })
  enderecoCompleto?: string;

  @Column({ default: false })
  precisaAutorizacao: boolean;

  @Column({ nullable: true })
  procedimentoAutorizacao?: string;

  @Column({ nullable: true })
  equipamentoModelo?: string;

  @Column('text', { nullable: true })
  descricaoProblema?: string;

  @Column('text', { nullable: true })
  fotoEquipamento?: string;

  @Column('text', { nullable: true })
  fotoVideoProblema?: string;

  @Column({ nullable: true })
  responsavelNome?: string;

  @Column({ nullable: true })
  responsavelTelefone?: string;

  @Column({ nullable: true })
  horarioDisponivel?: string;

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
