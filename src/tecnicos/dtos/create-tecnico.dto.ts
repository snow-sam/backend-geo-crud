import { ApiProperty } from '@dataui/crud/lib/crud';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateTecnicoDto {
  @ApiProperty({
    description: 'Nome do técnico',
    minLength: 3,
    example: 'Samuel Souza',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Numero de telefone do técnico',
    format: 'phone',
    minLength: 11,
    example: '11999999999',
  })
  @IsString()
  telefone: string;

  @ApiProperty({
    description: 'Email do técnico',
    format: 'email',
    example: 'exemplo@dominio.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description: 'Endereço do técnico',
    example: 'Av. Paulista 305',
  })
  @IsString()
  @MinLength(10, { message: 'Endereço deve ter no mínimo 10 caracteres' })
  endereco: string;

  @ApiProperty({
    required: false,
    description: 'Placa do veículo do técnico',
    example: 'ABC1D23',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}-?\d{1}[A-Z0-9]{1}\d{2}$|^[A-Z]{3}-\d{4}$/, {
    message: 'Formato de placa inválido. Use ABC-1234 ou ABC1D23',
  })
  placa?: string;

  @ApiProperty({
    required: false,
    description: 'Nivel de senioridade do técnico',
    example: 'Pleno',
  })
  @IsOptional()
  @IsString()
  especialidade?: string;

  @ApiProperty({
    required: false,
    description: 'Status de atividade do técnico',
    example: 'true',
    default: 'true',
  })
  @IsOptional()
  @IsBoolean()
  eAtivo?: boolean;

  @ApiProperty({
    required: false,
    description: 'PlaceID que atrela o endereço a um local no Google Maps',
    example: '11sbzq8q1f',
  })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiProperty({
    required: false,
    description: 'Latitude do local',
    example: '-23.5695964',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90, { message: 'Latitude deve estar entre -90 e 90' })
  @Max(90, { message: 'Latitude deve estar entre -90 e 90' })
  latitude?: number;

  @ApiProperty({
    required: false,
    description: 'Longitude do local',
    example: '-46.6496034',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180, { message: 'Longitude deve estar entre -180 e 180' })
  @Max(180, { message: 'Longitude deve estar entre -180 e 180' })
  longitude?: number;
}
