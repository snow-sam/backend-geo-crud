import { IsDateString } from 'class-validator';

export class GerarAgendaDto {
  @IsDateString()
  data: string; // formato YYYY-MM-DD
}

