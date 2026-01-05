import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

/**
 * DTO para os dados vindos do Excel durante importação
 */
export class ImportTecnicoDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString()
  telefone: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(10, { message: 'Endereço deve ter no mínimo 10 caracteres' })
  endereco: string;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  especialidade?: string;
}

/**
 * Interface para os dados brutos lidos do Excel
 */
export interface ExcelTecnicoRow {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  placa?: string;
  especialidade?: string;
}
