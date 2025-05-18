// src/odoo/dto/set-system-parameter.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class SetSystemParameterDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}
