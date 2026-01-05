import { IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class GerarAgendaDto {
  @IsDateString()
  data: string; // formato YYYY-MM-DD

  @IsOptional()
  @IsBoolean()
  salvar?: boolean;
}

