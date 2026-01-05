import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// Transforma strings vazias em null
const emptyToNull = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

export class CreateRelatorioVisitaDto {
  @IsUUID()
  @IsNotEmpty()
  visitaId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  avaliacao: number;

  @IsString()
  @IsNotEmpty()
  descricaoGeral: string;

  @IsString()
  @IsNotEmpty()
  horarioInicio: string;

  @Transform(emptyToNull)
  @IsString()
  @IsOptional()
  horarioFim?: string | null;

  @Transform(emptyToNull)
  @IsString()
  @IsOptional()
  observacoesAvaliacao?: string | null;
}

