import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GerarRoteiroDiaDto {
  @ApiProperty({
    description: 'Data do roteiro no formato YYYY-MM-DD',
    example: '2025-01-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data deve estar no formato YYYY-MM-DD',
  })
  data: string;

  @ApiPropertyOptional({
    description: 'Se true, salva os roteiros gerados no banco de dados',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  salvar?: boolean;
}


