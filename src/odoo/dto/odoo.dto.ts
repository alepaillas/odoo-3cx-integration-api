import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
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

  @IsNumber()
  @IsNotEmpty({ message: 'User ID is required' })
  user_id: number;

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
