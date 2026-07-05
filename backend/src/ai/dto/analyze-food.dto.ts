import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AnalyzeFoodDto {
  @IsNotEmpty({ message: 'El campo imageBase64 es requerido' })
  @IsString({ message: 'El campo imageBase64 debe ser una cadena de texto' })
  imageBase64: string;

  @IsOptional()
  @IsString({ message: 'El campo mimeType debe ser una cadena de texto' })
  mimeType?: string;
}
