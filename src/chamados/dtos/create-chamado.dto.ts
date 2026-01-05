import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateChamadoDto {
  @IsString()
  nomeEmpresa: string;

  @IsString()
  nomeFuncao: string;

  @IsString()
  telefoneContato: string;

  @IsString()
  enderecoCompleto: string;

  @IsBoolean()
  precisaAutorizacao: boolean;

  @IsOptional()
  @IsString()
  procedimentoAutorizacao?: string;

  @IsString()
  equipamentoModelo: string;

  @IsString()
  descricaoProblema: string;

  @IsOptional()
  @IsString()
  fotoEquipamento?: string;

  @IsOptional()
  @IsString()
  fotoVideoProblema?: string;

  @IsString()
  responsavelNome: string;

  @IsString()
  responsavelTelefone: string;

  @IsOptional()
  @IsString()
  horarioDisponivel?: string;
}
