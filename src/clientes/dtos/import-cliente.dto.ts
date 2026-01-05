import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsDateString,
} from 'class-validator';

/**
 * DTO para os dados vindos do Excel durante importação
 */
export class ImportClienteDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString()
  @MinLength(10, { message: 'Endereço deve ter no mínimo 10 caracteres' })
  endereco: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  ultimaVisita?: string;
}

/**
 * Interface para os dados brutos lidos do Excel
 */
export interface ExcelClienteRow {
  nome: string;
  endereco: string;
  telefone?: string;
  email?: string;
  descricao?: string;
  ultimaVisita?: string;
}
