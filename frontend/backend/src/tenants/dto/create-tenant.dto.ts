import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Plan } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'acme.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: '#3b82f6', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiProperty({ enum: Plan, default: Plan.BASIC })
  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;
}
