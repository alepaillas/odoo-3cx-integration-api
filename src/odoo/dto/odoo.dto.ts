import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';

export class SetSystemParameterDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead name is required' })
  name: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsEmail()
  @IsOptional()
  email_from?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsPhoneNumber()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  street2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  zip?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
