import { ApiProperty } from '@dataui/crud/lib/crud';
import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  Min,
  Max,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nome da Unidade',
    minLength: 3,
    example: 'Edificio Plaza',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Endereço da unidade',
    example: 'Av. Paulista 305',
  })
  @IsString()
  @MinLength(10, { message: 'Endereço deve ter no mínimo 10 caracteres' })
  endereco: string;

  @ApiProperty({
    description: 'Latitude do local',
    example: '-23.5695964',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude do local',
    example: '-46.6496034',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

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
    description: 'Numero de telefone do técnico',
    format: 'phone',
    minLength: 11,
    example: '11999999999',
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    required: false,
    description: 'Email do técnico',
    format: 'email',
    example: 'exemplo@dominio.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Descrição da unidade',
    example: 'Unidade 320 do Shopping Light',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    required: false,
    description: 'Última visita a unidade',
  })
  @IsOptional()
  @IsDateString()
  ultimaVisita?: string;
}
